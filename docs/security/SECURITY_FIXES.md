# 🔧 Security Fixes & Improvements

**Critical Bug Fixes for High Priority Issues**

---

## FIX H-1: Hybrid Signature Verification

### Original Code (Vulnerable)
```rust
// node/src/crypto.rs:101-110
Signature::Hybrid { ecdsa, pq } => {
    let ecdsa_valid = ecdsa.verify(message, public_key)?;
    let pq_valid = pq.verify(message, public_key)?;
    Ok(ecdsa_valid && pq_valid)
}
```

### Fixed Code
```rust
Signature::Hybrid { ecdsa, pq } => {
    // Ensure public key is also hybrid
    let PublicKeyData::Hybrid { 
        ecdsa: ecdsa_pk, 
        pq: pq_pk 
    } = public_key else {
        return Err(anyhow!("Hybrid signature requires hybrid public key"));
    };
    
    // Verify both signatures with correct keys
    let ecdsa_valid = ecdsa.verify(message, &**ecdsa_pk)?;
    let pq_valid = pq.verify(message, &**pq_pk)?;
    
    // Both must be valid
    Ok(ecdsa_valid && pq_valid)
}
```

---

## FIX H-2: Transaction Builder Input Validation

### Original Code (Vulnerable)
```rust
// node/src/transaction.rs:146-149
pub fn value(mut self, value: Decimal) -> Self {
    self.value = value;  // No validation!
    self
}
```

### Fixed Code
```rust
pub fn value(mut self, value: Decimal) -> Result<Self, anyhow::Error> {
    // Validate non-negative
    if value < dec!(0) {
        return Err(anyhow!("Value cannot be negative"));
    }
    
    // Validate doesn't exceed max supply
    if value > dec!(10_000_000_000) {
        return Err(anyhow!("Value exceeds max supply (10B IONX)"));
    }
    
    self.value = value;
    Ok(self)
}

// Also update other validation methods:
pub fn gas_limit(mut self, gas_limit: u64) -> Result<Self, anyhow::Error> {
    if gas_limit < 21_000 {
        return Err(anyhow!("Gas limit too low (min: 21,000)"));
    }
    if gas_limit > 10_000_000 {
        return Err(anyhow!("Gas limit too high (max: 10M)"));
    }
    self.gas_limit = gas_limit;
    Ok(self)
}

pub fn data(mut self, data: Vec<u8>) -> Result<Self, anyhow::Error> {
    if data.len() > 1_000_000 {  // 1MB limit
        return Err(anyhow!("Data too large (max: 1MB)"));
    }
    self.data = data;
    Ok(self)
}
```

---

## FIX H-3: Falcon Implementation

### Option A: Remove Falcon (Recommended for now)

```rust
// node/src/crypto.rs - Remove Falcon variant

pub enum SignatureAlgorithm {
    ECDSA,
    Dilithium,
    SPHINCSPlus,
    // Falcon,  // REMOVED - not yet implemented
    Hybrid,
}

pub enum Signature {
    ECDSA { r: [u8; 32], s: [u8; 32], v: u8 },
    Dilithium { data: Vec<u8> },
    SPHINCSPlus { data: Vec<u8> },
    // Falcon { data: Vec<u8> },  // REMOVED
    Hybrid { ecdsa: Box<Signature>, pq: Box<Signature> },
}

// Remove verify_falcon function
```

###Option B: Implement Falcon (Future)

```rust
// Add when library is available
use pqcrypto_falcon::falcon1024;

fn verify_falcon(
    message: &[u8],
    signature: &[u8],
    public_key: &PublicKeyData,
) -> Result<bool> {
    let PublicKeyData::Falcon { bytes: pk_bytes } = public_key else {
        return Err(anyhow!("Public key type mismatch"));
    };
    
    // Validate size
    if pk_bytes.len() != 1793 {
        return Err(anyhow!("Invalid Falcon public key size"));
    }
    
    let pk = falcon1024::PublicKey::from_bytes(pk_bytes)
        .map_err(|e| anyhow!("Invalid Falcon public key: {:?}", e))?;
    
    let mut signed_msg = Vec::with_capacity(message.len() + signature.len());
    signed_msg.extend_from_slice(signature);
    signed_msg.extend_from_slice(message);
    
    match falcon1024::open(&signed_msg, &pk) {
        Ok(verified_msg) => Ok(verified_msg == message),
        Err(_) => Ok(false),
    }
}
```

---

## FIX M-1: Gas Calculation Overflow Protection

```rust
// node/src/transaction.rs:93-94
pub fn calculate_gas_cost(&self) -> Result<u64, anyhow::Error> {
    let base_gas = 21_000u64;
    
    let sig_gas = match self.signature.algorithm() {
        // ... existing code ...
    };
    
    // Protected data gas calculation
    let data_gas = (self.data.len() as u64)
        .checked_mul(16)
        .ok_or(anyhow!("Data size causes gas overflow"))?;
    
    // Protected total calculation
    let total = base_gas
        .checked_add(sig_gas)
        .and_then(|sum| sum.checked_add(data_gas))
        .ok_or(anyhow!("Total gas cost overflow"))?;
    
    Ok(total)
}
```

---

## FIX M-2: RPC Rate Limiting

```rust
// node/Cargo.toml - Add dependency
[dependencies]
governor = "0.6"
parking_lot = "0.12"

// node/src/rpc.rs
use governor::{Quota, RateLimiter, state::{InMemoryState, NotKeyed}};
use std::num::NonZeroU32;

pub struct RpcState {
    limiter: RateLimiter<NotKeyed, InMemoryState, clock::DefaultClock>,
}

impl RpcState {
    pub fn new() -> Self {
        // 100 requests per second
        let quota = Quota::per_second(NonZeroU32::new(100).unwrap());
        Self {
            limiter: RateLimiter::direct(quota),
        }
    }
}

async fn handle_request(
    req: RpcRequest,
    tx_sender: Arc<mpsc::Sender<Transaction>>,
    shard_id: Arc<u8>,
    state: Arc<RpcState>,
) -> Result<impl Reply, Rejection> {
    // Check rate limit
    if state.limiter.check().is_err() {
        return Ok(warp::reply::json(&error_response(
            req.id,
            -32005,
            "Rate limit exceeded"
        )));
    }
    
    // ... rest of handler
}
```

---

## FIX M-4: Nonce Validation

```rust
// node/src/transaction.rs
impl Transaction {
    /// Validate nonce against account state
    pub fn validate_nonce(&self, account_nonce: u64) -> Result<()> {
        if self.nonce < account_nonce {
            return Err(anyhow!("Nonce too low (already used)"));
        }
        if self.nonce > account_nonce {
            return Err(anyhow!("Nonce too high (must be sequential)"));
        }
        Ok(())
    }
    
    /// Add transaction expiry
    pub fn is_expired(&self, current_time: u64) -> bool {
        // Transactions expire after 1 hour
        if let Some(expiry) = self.expiry {
            current_time > expiry
        } else {
            false
        }
    }
}

// Update Transaction struct
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub nonce: u64,
    pub from: Address,
    pub to: Address,
    pub value: Decimal,
    pub gas_limit: u64,
    pub gas_price: Decimal,
    pub data: Vec<u8>,
    pub signature: Signature,
    pub public_key: PublicKeyData,
    pub expiry: Option<u64>,  // NEW: Unix timestamp
}
```

---

## FIX M-7: Dilithium Key Size Validation

```rust
// node/src/crypto.rs:213-216
fn verify_dilithium(
    message: &[u8],
    signature: &[u8],
    public_key: &PublicKeyData,
) -> Result<bool> {
    let PublicKeyData::Dilithium { bytes: pk_bytes } = public_key else {
        return Err(anyhow!("Public key type mismatch"));
    };
    
    // Validate expected size (Dilithium5 = 2,528 bytes)
    const DILITHIUM5_PK_SIZE: usize = 2528;
    if pk_bytes.len() != DILITHIUM5_PK_SIZE {
        return Err(anyhow!(
            "Invalid Dilithium public key size: expected {}, got {}",
            DILITHIUM5_PK_SIZE,
            pk_bytes.len()
        ));
    }
    
    // Similarly validate signature size
    const DILITHIUM5_SIG_SIZE: usize = 4595;
    if signature.len() != DILITHIUM5_SIG_SIZE {
        return Err(anyhow!(
            "Invalid Dilithium signature size: expected {}, got {}",
            DILITHIUM5_SIG_SIZE,
            signature.len()
        ));
    }
    
    let pk = dilithium5::PublicKey::from_bytes(pk_bytes)
        .map_err(|e| anyhow!("Invalid Dilithium public key: {:?}", e))?;
    
    // ... rest of verification
}
```

---

## FIX L-2: Add Logging

```rust
// node/src/crypto.rs
use tracing::{info, warn, error};

pub fn verify(&self, message: &[u8], public_key: &PublicKeyData) -> Result<bool> {
    let algorithm = self.algorithm();
    
    match self {
        Signature::ECDSA { r, s, v } => {
            match verify_ecdsa(message, *r, *s, *v, public_key) {
                Ok(valid) => {
                    if !valid {
                        warn!(
                            algorithm = ?algorithm,
                            "Signature verification failed"
                        );
                    }
                    Ok(valid)
                }
                Err(e) => {
                    error!(
                        algorithm = ?algorithm,
                        error = %e,
                        "Signature verification error"
                    );
                    Err(e)
                }
            }
        }
        // ... similar for other types
    }
}
```

---

## Smart Contract Security Improvements

### Add Access Control to DEX

```solidity
// contracts/dex/IonovaSwapRouter.sol
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract IonovaSwapRouter is Ownable, Pausable {
    // Emergency pause
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Add slippage protection
    function swap(
        address[] calldata path,
        uint amountIn,
        uint minAmountOut,  // NEW
        address to,
        uint deadline
    ) external whenNotPaused returns (uint[] memory amounts) {
        require(block.timestamp <= deadline, "Expired");
        
        amounts = getAmountsOut(amountIn, path);
        uint amountOut = amounts[amounts.length - 1];
        
        // Slippage protection
        require(amountOut >= minAmountOut, "Slippage too high");
        
        // ... rest of swap logic
    }
}
```

### Add Oracle to Lending Protocol

```solidity
// contracts/lending/IonovaLend.sol
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract IonovaLend {
    mapping(address => AggregatorV3Interface) public priceOracles;
    
    function setPriceOracle(
        address asset,
        address oracle
    ) external onlyOwner {
        priceOracles[asset] = AggregatorV3Interface(oracle);
    }
    
    function getAssetPrice(address asset) public view returns (uint) {
        AggregatorV3Interface oracle = priceOracles[asset];
        require(address(oracle) != address(0), "No oracle set");
        
        (, int price,,,) = oracle.latestRoundData();
        require(price > 0, "Invalid price");
        
        return uint(price);
    }
    
    // Use oracle price for collateral calculations
    function calculateCollateralValue(
        address asset,
        uint amount
    ) public view returns (uint) {
        uint price = getAssetPrice(asset);
        return (amount * price) / 1e18;
    }
}
```

---

## Final Security Checklist

```markdown
### Before TestNet Launch

- [ ] Apply all HIGH priority fixes
- [ ] Add rate limiting to RPC
- [ ] Enable TLS on all endpoints
- [ ] Add input validation
- [ ] Implement logging
- [ ] Add circuit breakers
- [ ] Configure Docker security
- [ ] Run penetration tests
- [ ] External audit

### Before MainNet Launch

- [ ] Complete all MEDIUM priority fixes
- [ ] Achieve 90%+ test coverage
- [ ] Formal verification (critical paths)
- [ ] Economic attack analysis
- [ ] Bug bounty program ($100K pool)
- [ ] Insurance fund setup
- [ ] Incident response plan
- [ ] Public security disclosure
```

---

**Apply these fixes before proceeding to TestNet deployment!**

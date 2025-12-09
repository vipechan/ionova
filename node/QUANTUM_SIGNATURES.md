# Post-Quantum Signature Support

Ionova now supports **quantum-resistant signatures** alongside traditional ECDSA to ensure long-term security against quantum computing threats.

## Supported Signature Algorithms

| Algorithm | Type | Size | Speed | Quantum-Safe | Use Case |
|-----------|------|------|-------|--------------|----------|
| **ECDSA** | Traditional | 65 bytes | <1ms | ❌ No | Legacy wallets (MetaMask) |
| **Dilithium** | PQ Lattice | 2,420 bytes | 2ms | ✅ Yes | **Recommended for users** |
| **SPHINCS+** | PQ Hash | 2,048 bytes | 10ms | ✅ Yes | Validators, ultra-secure vaults |
| **Falcon** | PQ Lattice | 1,280 bytes | 1ms | ✅ Yes | Mobile/constrained devices |
| **Hybrid** | Both | ~2,485 bytes | 3ms | ✅ Yes | Transition period |

## Quick Start

### Using ECDSA (Traditional)

```rust
use ionova_node::crypto::{Signature, PublicKeyData, Address};
use ionova_node::transaction::{Transaction, TransactionBuilder};

// Traditional ECDSA transaction (compatible with MetaMask)
let tx = TransactionBuilder::new()
    .from(Address::EVM([0u8; 20]))
    .to(Address::EVM([1u8; 20]))
    .value(dec!(100))
    .build(
        Signature::ECDSA {
            r: [/* ... */],
            s: [/* ... */],
            v: 0,
        },
        PublicKeyData::ECDSA { bytes: [/* ... */] }
    )?;

// Gas cost: 24,000 (21k base + 3k signature)
```

### Using Dilithium (Quantum-Safe)

```rust
// Quantum-safe Dilithium transaction
let tx = TransactionBuilder::new()
    .from(Address::EVM([0u8; 20]))
    .to(Address::EVM([1u8; 20]))
    .value(dec!(100))
    .build(
        Signature::Dilithium {
            data: vec![/* 2,420 bytes */],
        },
        PublicKeyData::Dilithium { bytes: vec![/* 2,528 bytes */] }
    )?;

// Gas cost: 46,000 (21k base + 25k subsidized signature)
// Without subsidy would be 71,000
```

### Using Hybrid (Maximum Security)

```rust
// Both ECDSA and Dilithium signatures for transition period
let tx = TransactionBuilder::new()
    .from(Address::EVM([0u8; 20]))
    .to(Address::EVM([1u8; 20]))
    .value(dec!(100))
    .build(
        Signature::Hybrid {
            ecdsa: Box::new(Signature::ECDSA { /* ... */ }),
            pq: Box::new(Signature::Dilithium { /* ... */ }),
        },
        PublicKeyData::Hybrid { /* ... */ }
    )?;

// Gas cost: 28,000 (21k base + 3k ECDSA + 4k subsidized PQ)
```

## Gas Cost Comparison

| Signature Type | Actual Cost | Subsidized Cost | Savings |
|----------------|-------------|-----------------|---------|
| ECDSA | 24,000 | 24,000 | 0% |
| Dilithium | 71,000 | 46,000 | 35% |
| SPHINCS+ | 91,000 | 55,500 | 39% |
| Falcon | 56,000 | 38,500 | 31% |
| Hybrid | 74,000 | 28,000 | 62% |

**Subsidy applies during migration period (2025-2030) to encourage quantum-safe adoption.**

## Migration Timeline

### Phase 1: Optional PQ Support (2025-2026)
- Users can choose ECDSA or PQ signatures
- Both types accepted by network
- No incentives yet

### Phase 2: Incentivized Migration (2026-2029)
- **50% gas discount** for PQ signatures
- UI badges for "Quantum-Safe Wallet"
- Education campaigns

### Phase 3: ECDSA Deprecation (2029-2030)
- Warning messages for ECDSA users
- Higher fees for ECDSA (remove subsidy)
- Gradual phase-out

### Phase 4: PQ Only (2030+)
- ECDSA transactions rejected
- **Fully quantum-safe blockchain** ✅

## Architecture

```
┌─────────────────────────────────────────┐
│          User Wallet Layer              │
│   ECDSA or Dilithium or Hybrid         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Transaction Verification Layer      │
│  - Verify ECDSA (secp256k1)            │
│  - Verify Dilithium (lattice)          │
│  - Verify SPHINCS+ (hash-based)        │
│  - Verify Falcon (NTRU)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Validator Consensus Layer        │
│      SPHINCS+ Signatures (PQ-BFT)      │
└─────────────────────────────────────────┘
```

## Building & Testing

### Build with PQ Support

```bash
cd node
cargo build --release
```

### Run Tests

```bash
cargo test crypto::tests
cargo test transaction::tests
```

### Example Output

```
running 5 tests
test crypto::tests::test_signature_sizes ... ok
test crypto::tests::test_signature_algorithm ... ok
test transaction::tests::test_gas_cost_ecdsa ... ok
test transaction::tests::test_gas_cost_dilithium_subsidized ... ok
test transaction::tests::test_transaction_builder ... ok

test result: ok. 5 passed
```

## Dependencies

Added to `Cargo.toml`:

```toml
# Cryptography - ECDSA
secp256k1 = { version = "0.29", features = ["recovery", "std"] }

# Post-Quantum Cryptography
pqcrypto-dilithium = "0.5"
pqcrypto-sphincsplus = "0.8"
pqcrypto-falcon = "0.3"
pqcrypto-traits = "0.3"
```

## Security Guarantees

### ECDSA (Traditional)
- ✅ Secure against classical computers
- ❌ Vulnerable to quantum computers (Shor's algorithm)
- 📅 Safe until ~2030-2035

### Dilithium (Post-Quantum)
- ✅ Secure against classical computers
- ✅ Secure against quantum computers
- ✅ NIST-approved standard (2022)
- 📅 Safe forever

### Hybrid Mode
- ✅ Secure if EITHER signature is safe
- ✅ Maximum security during transition
- ✅ Protects against premature quantum breakthroughs

## Next Steps

1. ✅ Core crypto module implemented
2. ✅ Transaction structure updated
3. ✅ Gas calculation with subsidies
4. 🔄 RPC API updates (in progress)
5. ⏳ Wallet SDK development
6. ⏳ UI/UX for PQ wallets
7. ⏳ Testnet deployment

## Resources

- [Migration Strategy](../../.gemini/antigravity/brain/*/QUANTUM_MIGRATION_STRATEGY.md)
- [Consensus Comparison](../../.gemini/antigravity/brain/*/CONSENSUS_COMPARISON.md)
- [NIST PQ Standards](https://csrc.nist.gov/projects/post-quantum-cryptography)

---

**Ionova: Building the quantum-safe future of blockchain** 🚀🔐

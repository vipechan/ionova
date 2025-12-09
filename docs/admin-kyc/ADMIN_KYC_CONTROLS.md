# 🎛️ Admin KYC Threshold Controls

**Dynamic KYC Threshold Management for Regulatory Flexibility**

---

## 📋 Overview

The KYC threshold is now **fully configurable by admin** instead of being hardcoded. This allows you to:
- Adjust limits based on regulatory changes
- Test different thresholds for conversion rates
- Respond to market conditions
- Comply with evolving regulations

---

## 💻 Smart Contract Implementation

### State Variable

```solidity
// KYC Threshold (admin configurable)
uint256 public kycThreshold = 100; // Default: >100 fractions require KYC

// Event
event KYCThresholdUpdated(uint256 newThreshold);
```

### Admin Functions

```solidity
/**
 * @notice Update KYC threshold (owner only)
 * @param newThreshold New fraction limit requiring KYC
 */
function setKYCThreshold(uint256 newThreshold) external onlyOwner {
    require(newThreshold > 0, "Threshold must be > 0");
    kycThreshold = newThreshold;
    emit KYCThresholdUpdated(newThreshold);
}

/**
 * @notice Get current KYC threshold
 */
function getKYCThreshold() external view returns (uint256) {
    return kycThreshold;
}
```

### Purchase Logic

```solidity
function buyFractions(...) external {
    // ...
    
    // KYC check uses dynamic threshold
    if (quantity > kycThreshold) {
        require(kycVerified[msg.sender], "KYC required for large purchases");
    }
    
    // ...
}
```

---

## 🎯 Usage Examples

### Example 1: Lower Threshold (More Strict)

```javascript
// Regulatory change requires $500 limit
// At $15/fraction average = ~33 fractions

await validatorContract.setKYCThreshold(33);

// Now:
// - Buy 1-33 fractions: No KYC ✅
// - Buy 34+ fractions: KYC required ✅
```

### Example 2: Raise Threshold (More Freedom)

```javascript
// Early adopter incentive - allow larger purchases without KYC
await validatorContract.setKYCThreshold(500);

// Now:
// - Buy 1-500 fractions: No KYC ✅  (~$7,500 value)
// - Buy 501+ fractions: KYC required ✅
```

### Example 3: Temporary Adjustment

```javascript
// Holiday promotion - reduce friction
await validatorContract.setKYCThreshold(200); // Allow up to $3k

// After 30 days, return to normal
await validatorContract.setKYCThreshold(100); // Back to ~$1.5k
```

### Example 4: Emergency Response

```javascript
// Regulatory warning - immediately reduce threshold
await validatorContract.setKYCThreshold(50); // Reduce to $750

// Protects project while complying with new rules
```

---

## 🌍 Regulatory Compliance Scenarios

### Scenario 1: US FinCEN Compliance

```javascript
// FinCEN threshold: $3,000
const avgPrice = 15; // USD per fraction
const threshold = Math.floor(3000 / avgPrice); // = 200 fractions

await validatorContract.setKYCThreshold(200);

// Result: Under $3k threshold for most of sale
```

### Scenario 2: EU 5AMLD Compliance

```javascript
// 5AMLD threshold: €1,000 (~$1,100)
const eurLimit = 1100; // USD
const threshold = Math.floor(eurLimit / avgPrice); // = 73 fractions

await validatorContract.setKYCThreshold(73);

// Result: Compliant with EU regulations
```

### Scenario 3: Singapore MAS Compliance

```javascript
// MAS threshold: S$5,000 (~$3,700)
const sgdLimit = 3700; // USD
const threshold = Math.floor(sgdLimit / avgPrice); // = 246 fractions

await validatorContract.setKYCThreshold(246);

// Result: Compliant with Singapore regulations
```

---

## 📊 Threshold Strategy by Sale Phase

### Phase 1: Early Sale (Fractions 1-600k)
```javascript
// Price Range: $10-$40
// Strategy: Lower threshold for early compliance

await validatorContract.setKYCThreshold(75);

// At $25 avg = $1,875 limit
// Conservative approach during high-scrutiny launch
```

### Phase 2: Mid Sale (Fractions 600k-1.2M)
```javascript
// Price Range: $40-$70
// Strategy: Normal threshold

await validatorContract.setKYCThreshold(100);

// At $55 avg = $5,500 limit
// Balanced approach during steady growth
```

### Phase 3: Late Sale (Fractions 1.2M-1.8M)
```javascript
// Price Range: $70-$100
// Strategy: Higher threshold (prices naturally limit)

await validatorContract.setKYCThreshold(150);

// At $85 avg = $12,750 limit
// Fewer users can afford anyway, reduce friction
```

---

## 🎯 Hardhat Scripts

### Check Current Threshold

```javascript
// scripts/check-kyc-threshold.js
const { ethers } = require("hardhat");

async function main() {
  const contract = await ethers.getContractAt(
    "ValidatorFractionNFT",
    process.env.CONTRACT_ADDRESS
  );
  
  const threshold = await contract.getKYCThreshold();
  console.log(`Current KYC threshold: ${threshold} fractions`);
  
  // Calculate USD value
  const currentPrice = await contract.getFractionPrice(
    await contract.fractionsSold() + threshold
  );
  const usdValue = threshold * (currentPrice / 1e6);
  console.log(`Approximate USD value: $${usdValue.toFixed(2)}`);
}

main();
```

### Update Threshold

```javascript
// scripts/update-kyc-threshold.js
const { ethers } = require("hardhat");

async function main() {
  const newThreshold = process.argv[2] || 100;
  
  const contract = await ethers.getContractAt(
    "ValidatorFractionNFT",
    process.env.CONTRACT_ADDRESS
  );
  
  console.log(`Updating KYC threshold to: ${newThreshold} fractions`);
  
  const tx = await contract.setKYCThreshold(newThreshold);
  await tx.wait();
  
  console.log(`✅ Threshold updated! Tx: ${tx.hash}`);
}

main();
```

**Usage:**
```bash
# Update to 200 fractions
npx hardhat run scripts/update-kyc-threshold.js --network mainnet 200

# Check current
npx hardhat run scripts/check-kyc-threshold.js --network mainnet
```

---

## 🎨 Frontend Integration

### Display Current Threshold

```jsx
function PurchaseWidget() {
  const [threshold, setThreshold] = useState(100);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadThreshold();
  }, []);

  const loadThreshold = async () => {
    const currentThreshold = await contract.getKYCThreshold();
    setThreshold(currentThreshold.toNumber());
  };

  const needsKYC = quantity > threshold;

  return (
    <div>
      <h3>Buy Fractions</h3>
      
      <input 
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      
      {needsKYC ? (
        <div className="kyc-required">
          🔐 KYC Required (limit: {threshold} fractions)
        </div>
      ) : (
        <div className="no-kyc">
          ✅ No KYC needed (up to {threshold} fractions)
        </div>
      )}
      
      <button disabled={needsKYC && !isKYCVerified}>
        Buy Fractions
      </button>
    </div>
  );
}
```

### Admin Dashboard

```jsx
function AdminKYCSettings() {
  const [currentThreshold, setCurrentThreshold] = useState(100);
  const [newThreshold, setNewThreshold] = useState(100);

  const updateThreshold = async () => {
    const tx = await contract.setKYCThreshold(newThreshold);
    await tx.wait();
    
    setCurrentThreshold(newThreshold);
    alert(`✅ Threshold updated to ${newThreshold} fractions`);
  };

  return (
    <div className="admin-kyc-settings">
      <h3>KYC Threshold Settings</h3>
      
      <div className="current">
        <strong>Current Threshold:</strong> {currentThreshold} fractions
      </div>
      
      <div className="update">
        <label>New Threshold:</label>
        <input 
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(e.target.value)}
          min="1"
        />
        <button onClick={updateThreshold}>Update</button>
      </div>
      
      <div className="presets">
        <h4>Quick Presets:</h4>
        <button onClick={() => setNewThreshold(50)}>
          50 (~$750)
        </button>
        <button onClick={() => setNewThreshold(100)}>
          100 (~$1.5k) - Default
        </button>
        <button onClick={() => setNewThreshold(200)}>
          200 (~$3k) - US Limit
        </button>
        <button onClick={() => setNewThreshold(500)}>
          500 (~$7.5k) - High
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 Analytics & Monitoring

### Track Threshold Changes

```javascript
// Backend analytics
app.get('/api/analytics/kyc-threshold-history', async (req, res) => {
  const events = await contract.queryFilter(
    contract.filters.KYCThresholdUpdated()
  );
  
  const history = events.map(e => ({
    threshold: e.args.newThreshold.toNumber(),
    timestamp: new Date(e.block.timestamp * 1000),
    txHash: e.transactionHash
  }));
  
  res.json(history);
});
```

### Monitor Conversion Impact

```javascript
async function analyzeThresholdImpact() {
  const purchases = await db.purchases.find({
    timestamp: { $gte: lastThresholdChange }
  });
  
  const belowThreshold = purchases.filter(p => p.quantity <= threshold).length;
  const aboveThreshold = purchases.filter(p => p.quantity > threshold).length;
  
  console.log(`Below threshold (no KYC): ${belowThreshold}`);
  console.log(`Above threshold (KYC): ${aboveThreshold}`);
  console.log(`KYC rate: ${(aboveThreshold / purchases.length * 100).toFixed(2)}%`);
}
```

---

## ✅ Best Practices

### 1. **Announce Changes in Advance**
```
Dear Community,

Due to regulatory updates, we're adjusting our KYC threshold from 
100 to 75 fractions starting January 1st.

This means:
- Purchases up to 75 fractions: No KYC ✅
- Purchases 76+: KYC required ✅

Existing purchases are unaffected.
```

### 2. **Use Multi-Sig for Changes**
```javascript
// Don't update directly from EOA
// Use Gnosis Safe multi-sig

const safe = await getSafeContract();
await safe.proposeTransaction(
  contractAddress,
  0,
  data: contract.interface.encodeFunctionData('setKYCThreshold', [75])
);

// Requires 3/5 signatures
```

### 3. **Test on Testnet First**
```bash
# Test on Sepolia
npx hardhat run scripts/update-kyc-threshold.js --network sepolia 75

# Verify works as expected
# Then deploy to mainnet
```

### 4. **Document Reason for Changes**
```javascript
// Create entry in change log
await db.changeLog.create({
  change: 'KYC Threshold',
  from: 100,
  to: 75,
  reason: 'EU 5AMLD compliance requirement',
  approvedBy: ['admin1', 'admin2', 'admin3'],
  timestamp: new Date()
});
```

---

## 📋 Summary

**What's Added:**
- ✅ `kycThreshold` state variable (default: 100)
- ✅ `setKYCThreshold()` admin function
- ✅ `getKYCThreshold()` view function
- ✅ `KYCThresholdUpdated` event
- ✅ Dynamic threshold check in `buyFractions()`

**Benefits:**
- 🎯 Regulatory flexibility
- 📊 A/B testing capability
- ⚡ Quick emergency adjustments
- 🌍 Multi-jurisdiction compliance
- 📈 Optimize for conversion

**Default Value:** 100 fractions (~$1,500)

**Can Adjust To:**
- Lower (50-75): More strict, better compliance
- Higher (200-500): More freedom, better UX
- Emergency (1): Require KYC for all purchases

---

**🚀 Full Admin Control Over KYC Requirements!**

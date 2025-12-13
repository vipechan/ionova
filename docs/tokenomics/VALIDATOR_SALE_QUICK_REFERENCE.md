# Ionova Validator Sale - Quick Reference

**Last Updated:** December 10, 2025  
**Status:** ✅ FINAL MODEL CONFIRMED

---

## 💎 Per Fraction Economics

### Lifetime Rewards (15 Years)
**Total:** 3,750 IONX per fraction

### Annual Breakdown (Halving Schedule)
| Year | Per Fraction | % of Total | Daily Average |
|------|--------------|------------|---------------|
| 1 | 1,875 IONX | 50.0% | 5.14 IONX |
| 2 | 937.5 IONX | 25.0% | 2.57 IONX |
| 3 | 468.75 IONX | 12.5% | 1.28 IONX |
| 4 | 234.38 IONX | 6.25% | 0.64 IONX |
| 5 | 117.19 IONX | 3.13% | 0.32 IONX |
| 6-15 | ~117 IONX | 3.12% | ~0.32 IONX |

### Distribution Model
- **50% Immediately Claimable** - Available to withdraw instantly
- **50% Auto-Staked** - Vests linearly over 15 years

---

## 💰 Investment Returns

### Purchase Price Range
- **Minimum:** $10/fraction (first buyer)
- **Maximum:** $100/fraction (last buyer)
- **Bonding Curve:** Linear progression

### ROI Examples (Assuming $1/IONX)

**Early Buyer ($10/fraction):**
- Year 1 rewards: 1,875 IONX = $1,875
- Year 1 ROI: 18,650%
- Lifetime rewards: 3,750 IONX = $3,750
- Lifetime ROI: 37,400%

**Mid-Range Buyer ($55/fraction):**
- Year 1 rewards: 1,875 IONX = $1,875
- Year 1 ROI: 3,309%
- Lifetime rewards: 3,750 IONX = $3,750
- Lifetime ROI: 6,718%

**Late Buyer ($100/fraction):**
- Year 1 rewards: 1,875 IONX = $1,875
- Year 1 ROI: 1,775%
- Lifetime rewards: 3,750 IONX = $3,750
- Lifetime ROI: 3,650%

---

## 📊 Total Supply Impact

### For All 1.8M Fractions
- **Total Distributed:** 6.75B IONX (over 15 years)
- **Year 1:** 3.375B IONX
- **Year 2:** 1.6875B IONX
- **% of Total Supply:** 67.5% of the 10B total

### Validation
✅ Fits within 79% emission schedule (7.9B IONX)  
✅ Validator allocation: 20% of emissions  
✅ Matches FINAL_VESTING_MODEL.md

---

## 🎯 Sale Details

- **Total Fractions:** 1,800,000
- **Validators:** 18 (100,000 fractions each)
- **Price Range:** $10 - $100 (linear bonding curve)
- **Total Raise:** ~$100,000,000
- **KYC Required:** Yes (for purchases > 100 fractions)
- **Payment:** USDC or USDT

---

## 📱 Contract Functions

### Buy Fractions
```solidity
function buyFractions(
    uint256 quantity,
    address referrer,
    address paymentToken
) external
```

### Claim Rewards
```solidity
function claimRewards() external
// Claims immediately available + vested auto-staked
```

### View Functions
```solidity
function getCurrentPrice() external view returns (uint256)
function getPendingRewards(address owner) external view returns (uint256)
function getTotalFractionsOwned(address owner) external view returns (uint256)
```

---

## 🔗 Source Documents

- `FINAL_VESTING_MODEL.md` - Complete emission model
- `CORRECT_VESTING_EMISSION.md` - Vesting mechanics
- `IONX_TOKENOMICS.md` - Full tokenomics
- `VALIDATOR_SALE_README.md` - Technical implementation

---

**✅ REMEMBER: 3,750 IONX per fraction over 15 years with annual halving**

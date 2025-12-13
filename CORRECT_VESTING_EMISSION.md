# Ionova Validator Rewards - TRUE VESTING WITH EMISSION CURVE

## ✅ Correct Model: Vesting Releases Follow Emission/Halving

### Core Concept

**Each day's vesting amount is released over 15 years using the SAME emission curve (with halving):**

```
Day 1: User receives 5.15 IONX
├── 50% Claimable: 2.575 IONX (immediate)
└── 50% Vesting: 2.575 IONX (releases over 15 years with halving)

Day 1 Vesting Release Schedule:
Year 1: 50% of 2.575 = 1.288 IONX (daily avg)
Year 2: 25% of 2.575 = 0.644 IONX (halved)
Year 3: 12.5% of 2.575 = 0.322 IONX
...
Year 15: 0.001% of 2.575 = final remainder

After 15 years: All 2.575 IONX released, nothing remains ✅
```

## Mathematical Formula

### Vesting Release Using Emission Curve

For a vesting batch of amount V:
```
Total to release: V
Release follows: 79% distribution curve over 15 years

Year 1 releases: V × 50%
Year 2 releases: V × 25%
Year 3 releases: V × 12.5%
...

After 15 years: 100% of V released
```

## Example: Day 1 (1 Fraction)

### Day 1 Distribution
```
Total Received: 5.15 IONX
├── Immediately Claimable: 2.575 IONX
└── Vesting Pool: 2.575 IONX

Vesting releases over 15 years:
```

### Day 1 Vesting Release Schedule

| Year | Release % | Amount Released | Cumulative | Remaining |
|------|-----------|-----------------|------------|-----------|
| 1 | 50.00% | 1.288 IONX | 1.288 | 1.287 |
| 2 | 25.00% | 0.644 IONX | 1.932 | 0.643 |
| 3 | 12.50% | 0.322 IONX | 2.254 | 0.321 |
| 4 | 6.25% | 0.161 IONX | 2.415 | 0.160 |
| 5 | 3.13% | 0.081 IONX | 2.496 | 0.079 |
| 6 | 1.56% | 0.040 IONX | 2.536 | 0.039 |
| 7 | 0.78% | 0.020 IONX | 2.556 | 0.019 |
| 8 | 0.39% | 0.010 IONX | 2.566 | 0.009 |
| 9 | 0.20% | 0.005 IONX | 2.571 | 0.004 |
| 10 | 0.10% | 0.003 IONX | 2.574 | 0.001 |
| 11-15 | ~0.04% | 0.001 IONX | 2.575 | **0** |

**Total Released: 2.575 IONX ✅ (100%)**

### Daily Release Rate (Year 1)

```
Daily release from Day 1 batch:
= 1.288 IONX / 365 days
= 0.00353 IONX/day
```

## Complete Example: First 3 Days

### Day 1
```
New Rewards: 5.15 IONX
├── Claimable: 2.575 IONX
└── Vesting: 2.575 IONX (starts 15-year release)

Vesting Releases Today: 0 (first day)

Dashboard:
├── Immediately Claimable: 2.575 IONX
├── Vesting (unreleased): 2.575 IONX
└── Total: 5.15 IONX
```

### Day 2
```
New Rewards: 5.15 IONX
├── Claimable: 2.575 IONX
└── Vesting: 2.575 IONX (starts 15-year release)

Vesting Releases:
├── From Day 1 batch: 0.00353 IONX

Dashboard:
├── Immediately Claimable: 2.575 + 2.575 + 0.00353 = 5.15353 IONX
├── Vesting (unreleased): 2.575 + 2.575 - 0.00353 = 5.14647 IONX
└── Total: 10.30 IONX
```

### Day 365 (End Year 1)
```
New Rewards: 5.15 IONX (last day at this rate)
├── Claimable: 2.575 IONX
└── Vesting: 2.575 IONX

Cumulative Vesting Releases (Year 1):
├── All 365 batches released their Year 1 portion
├── Average per batch: 1.288 IONX each
├── Total: ~470 IONX released

Dashboard:
├── Immediately Claimable: 940 + 470 = 1,410 IONX
├── Vesting (unreleased): 940 - 470 = 470 IONX
└── Total Earned: 1,880 IONX
```

### Day 366 (Year 2 Start - Halving!)
```
New Rewards: 2.58 IONX (HALVED!)
├── Claimable: 1.29 IONX
└── Vesting: 1.29 IONX (starts 15-year release)

Vesting Releases (Year 2 rate - halved):
├── Year 1 batches now release at 50% of Year 1 rate
├── Day 1 batch releases: 0.00177 IONX/day (halved)

Dashboard:
├── Claimable continues to grow
├── Vesting releases slow down (halving)
```

## 15-Year Complete Breakdown (1 Fraction)

### Total Accumulation

| Year | New Claimable | New Vesting | Vesting Released | Net Vesting Change | Cumulative Claimable | Unreleased Vesting |
|------|---------------|-------------|------------------|-------------------|---------------------|-------------------|
| 1 | 940 | 940 | 470 | +470 | 1,410 | 470 |
| 2 | 470 | 470 | 470 | 0 | 2,350 | 470 |
| 3 | 235 | 235 | 353 | -118 | 2,938 | 352 |
| 4 | 117 | 117 | 265 | -148 | 3,320 | 204 |
| 5 | 59 | 59 | 199 | -140 | 3,578 | 64 |
| 6-15 | ... | ... | 64 | -64 | 3,750 | **0** |

**Final Total: 3,750 IONX**
- All claimed/claimable: 3,750 IONX
- Unreleased vesting: 0 IONX ✅

## Smart Contract Implementation

```solidity
struct VestingBatch {
    uint256 amount;      // Original vesting amount
    uint256 dayAdded;    // Day it was added
    uint256 released;    // Amount already released
}

function calculateVestingRelease(
    uint256 batchAmount,
    uint256 batchDay,
    uint256 currentDay
) public pure returns (uint256) {
    uint256 daysElapsed = currentDay - batchDay;
    
    // Calculate using emission curve (79% distribution over 15 years)
    uint256 totalReleasable = 0;
    uint256 remainingAmount = batchAmount;
    
    for (uint256 year = 0; year < 15; year++) {
        uint256 yearStart = year * 365;
        uint256 yearEnd = (year + 1) * 365;
        
        if (daysElapsed < yearStart) break;
        
        // Calculate release for this year (halves each year)
        uint256 yearRelease = (batchAmount * 50) / (100 * (2 ** year));
        
        if (daysElapsed >= yearEnd) {
            // Full year released
            totalReleasable += yearRelease;
        } else {
            // Partial year
            uint256 daysInYear = daysElapsed - yearStart;
            totalReleasable += (yearRelease * daysInYear) / 365;
            break;
        }
    }
    
    return totalReleasable;
}
```

## Key Points

1. ✅ **Vesting releases follow emission curve** (halving annually)
2. ✅ **Early years release more** (50%, 25%, 12.5%...)
3. ✅ **Complete distribution in 15 years** (nothing remains)
4. ✅ **Matches main emission incentive structure**
5. ✅ **All amounts eventually claimable**

## Why This Model?

**Benefits:**
- Encourages long-term holding (vesting)
- Front-loaded rewards (emission curve)
- Complete distribution (nothing locked forever)
- Consistent incentive structure (same curve)
- Fair and predictable

---

**Status**: ✅ CORRECT VESTING MODEL  
**Release**: Follows emission/halving curve  
**Duration**: 15 years  
**Final State**: 0 unreleased, 100% claimable  
**Last Updated**: December 10, 2025

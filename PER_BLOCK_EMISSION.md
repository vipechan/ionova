# Ionova Per-Block Emission Implementation

## 🎯 Overview

Successfully converted Ionova's emission system from **time-based** to **block-based** distribution for optimal accuracy with 1-second block time.

## 📊 Block Emission Parameters

### Constants
```solidity
INITIAL_BLOCK_EMISSION = 125_254_837_962_962_962 wei (~125.25 IONX/block)
BLOCKS_PER_DAY = 86,400 blocks (1-second block time)
BLOCKS_PER_YEAR = 31,536,000 blocks
HALVING_BLOCKS = 31,536,000 blocks (annual halving)
GENESIS_BLOCK = Block number at deployment
```

### Emission Rates

| Timeframe | Total Pool | Per Fraction | Per 100 Fractions |
|-----------|------------|--------------|-------------------|
| **Per Block** | 125.25 IONX | 0.00005964 IONX | 0.005964 IONX |
| **Per Minute (60)** | 7,515 IONX | 0.003578 IONX | 0.3578 IONX |
| **Per Hour (3,600)** | 450,913 IONX | 0.2147 IONX | 21.47 IONX |
| **Per Day (86,400)** | 10,821,918 IONX | 5.15 IONX | 515 IONX |
| **Per Year (31.536M)** | 3,950M IONX | 1,880 IONX | 188,000 IONX |

## 🔧 Implementation Changes

### 1. Storage Changes

**Before (Time-based):**
```solidity
uint256 public constant INITIAL_DAILY_EMISSION = 10_821_918 * 10**18;
uint256 public constant HALVING_INTERVAL = 365 days;
uint256 public immutable GENESIS_TIMESTAMP;
mapping(address => uint256) public lastClaimTime; // Stored timestamp
```

**After (Block-based):**
```solidity
uint256 public constant INITIAL_BLOCK_EMISSION = 125_254_837_962_962_962;
uint256 public constant HALVING_BLOCKS = 31_536_000;
uint256 public immutable GENESIS_BLOCK;
mapping(address => uint256) public lastClaimTime; // Stores block number
```

### 2. Core Functions

**getCurrentBlockEmission()** - Primary emission function
```solidity
function getCurrentBlockEmission() public view returns (uint256) {
    uint256 blocksSinceGenesis = block.number - GENESIS_BLOCK;
    uint256 halvingsPassed = blocksSinceGenesis / HALVING_BLOCKS;
    
    if (halvingsPassed >= 15) {
        return INITIAL_BLOCK_EMISSION / (2 ** 15);
    }
    
    return INITIAL_BLOCK_EMISSION / (2 ** halvingsPassed);
}
```

**getEmissionPerBlock(fractions)** - Calculate user's per-block reward
```solidity
function getEmissionPerBlock(uint256 fractions) public view returns (uint256) {
    uint256 activePool = getTotalActiveFractions();
    if (activePool == 0) return 0;
    
    uint256 blockEmission = getCurrentBlockEmission();
    return (blockEmission * fractions) / activePool;
}
```

**calculatePendingRewards(user)** - Block-based reward calculation
```solidity
function calculatePendingRewards(address user) public view returns (uint256) {
    uint256 userFractions = totalFractionsOwned[user];
    if (userFractions == 0) return 0;
    
    uint256 lastClaimBlock = lastClaimTime[user];
    if (lastClaimBlock == 0) lastClaimBlock = GENESIS_BLOCK;
    
    uint256 blocksSinceLastClaim = block.number - lastClaimBlock;
    if (blocksSinceLastClaim == 0) return pendingRewards[user];
    
    uint256 userRewardPerBlock = getEmissionPerBlock(userFractions);
    uint256 accruedRewards = userRewardPerBlock * blocksSinceLastClaim;
    
    return pendingRewards[user] + accruedRewards;
}
```

## 📈 Halving Schedule (Block-Based)

| Epoch | Blocks | Per Block (Pool) | Per Block (1 Fraction) | Cumulative % |
|-------|--------|------------------|------------------------|--------------|
| **0** | 0 - 31.5M | **125.25 IONX** | **0.00005964 IONX** | 50.0% |
| **1** | 31.5M - 63M | **62.63 IONX** | **0.00002982 IONX** | 75.0% |
| **2** | 63M - 94.6M | **31.31 IONX** | **0.00001491 IONX** | 87.5% |
| **3** | 94.6M - 126M | **15.66 IONX** | **0.00000745 IONX** | 93.75% |
| 4 | 126M - 158M | 7.83 IONX | 0.00000373 IONX | 96.88% |
| 5 | 158M - 189M | 3.91 IONX | 0.00000186 IONX | 98.44% |
| ... | ... | ... | ... | ... |
| 14 | 441M - 473M | 0.0038 IONX | 0.0000000018 IONX | 100.0% |

## ✅ Advantages of Block-Based Emission

1. **Accuracy**: Tied directly to blockchain consensus
2. **Predictability**: Exact rewards per block, no time drift
3. **Gas Efficiency**: Simpler calculations (block.number vs block.timestamp)
4. **Auditability**: Clear emission at every block height
5. **Fairness**: Proportional to network participation (blocks produced)
6. **Halving Precision**: Exact block-based halving triggers

## 🔄 Backward Compatibility

**UI/Frontend Compatibility:**
```solidity
// Kept for UI display
function getCurrentDailyEmission() public view returns (uint256) {
    return getCurrentBlockEmission() * BLOCKS_PER_DAY;
}
```

Frontend can still display daily/annual rates without changes.

## 📝 Example Calculations

### Scenario: User holds 100 fractions for 1,000 blocks

```solidity
// 1. Get user's per-block emission
userRewardPerBlock = (125.25 IONX * 100) / 2,100,000
                   = 0.005964 IONX/block

// 2. Calculate rewards for 1,000 blocks
totalRewards = 0.005964 * 1,000
             = 5.964 IONX

// 3. With 50% auto-staking
autoStaked = 5.964 * 0.5 = 2.982 IONX
claimable = 5.964 * 0.5 = 2.982 IONX
```

### Daily Verification (86,400 blocks)

```
Per-block emission: 125.25 IONX
Blocks per day: 86,400
Daily emission: 125.25 * 86,400 = 10,821,900 IONX ✓
```

## 🚀 Deployment Notes

1. **Genesis Block**: Recorded at deployment (`GENESIS_BLOCK = block.number`)
2. **First Halving**: At block `GENESIS_BLOCK + 31,536,000`
3. **Claim Tracking**: `lastClaimTime[user]` stores block number (not timestamp)
4. **Migration**: If upgrading from time-based, need to convert existing claims

## 🔍 Testing Checklist

- [ ] Verify emission rate matches target (10.82M IONX/day)
- [ ] Test halving triggers at correct block heights
- [ ] Confirm reward calculations for various holding periods
- [ ] Validate claim functionality with block numbers
- [ ] Test edge cases (genesis block, no fractions, etc.)
- [ ] Gas cost comparison vs time-based approach
- [ ] Ensure backward compatibility for UI

## 📚 Related Files

- `ValidatorFractionNFT.sol` - Updated ✅
- `IONXToken.sol` - To be updated
- `ValidatorFractionNFT-Upgradeable.sol` - To be updated

---

**Status**: ✅ Main contract updated  
**Block Time**: 1 second  
**Emission Model**: Per-block (125.25 IONX/block)  
**Halving**: Every 31,536,000 blocks (1 year)  
**Last Updated**: December 10, 2025

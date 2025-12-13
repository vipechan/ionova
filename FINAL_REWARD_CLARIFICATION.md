# Ionova Validator Rewards - Final Clarification

## ✅ Correct Understanding: Both Portions Follow 15-Year Emission

### 🎯 How Rewards Are Credited

**Every day for 15 years, users receive rewards from the emission schedule:**

```
Daily Emission → Split 50/50 → Both credited to user balances

┌─────────────────────────────────────────┐
│     15-Year Emission Schedule           │
│  (Halves every year, stops after 15)   │
└─────────────┬───────────────────────────┘
              │
              ├─ 50% → Claimable Balance (credited daily)
              │
              └─ 50% → Auto-Staked Balance (credited daily)

After 15 Years:
⛔ Emission stops
⛔ No more credits to Claimable
⛔ No more credits to Auto-Staked
✅ Both balances claimable forever
```

## 📊 Year-by-Year Crediting (100 Fractions Example)

### Year 1 (Highest Emission)
```
Daily Emission for User: 515 IONX
├── Credited to Claimable: 257.5 IONX
└── Credited to Auto-Staked: 257.5 IONX

After 365 days:
├── Claimable Balance: 94,000 IONX
└── Auto-Staked Balance: 94,000 IONX
Total: 188,000 IONX
```

### Year 2 (First Halving)
```
Daily Emission for User: 257.5 IONX (halved!)
├── Credited to Claimable: 128.75 IONX
└── Credited to Auto-Staked: 128.75 IONX

After 365 days:
├── Claimable Balance: 47,000 IONX (new credits)
└── Auto-Staked Balance: 47,000 IONX (new credits)
Total New: 94,000 IONX

Cumulative (Year 1 + Year 2):
├── Total Claimable: 141,000 IONX
└── Total Auto-Staked: 141,000 IONX
Grand Total: 282,000 IONX
```

### Year 3-15 (Continuing Halvings)
```
Each year, daily emission halves
Each day, both balances get credited (50/50 split)
Crediting continues for exactly 15 years
```

### Year 16+ (Emission Stopped)
```
Daily Emission: 0 IONX ⛔

No credits to:
├── Claimable Balance ⛔
└── Auto-Staked Balance ⛔

Final Balances (from 15 years):
├── Claimable: ~187,500 IONX (claimable forever)
└── Auto-Staked: ~187,500 IONX (claimable forever)
Total: ~375,000 IONX (final, no more ever)
```

## 📈 Complete 15-Year Crediting Schedule

| Year | Daily Emission/User | Daily to Claimable | Daily to Auto-Staked | Annual Each | Cumulative Each |
|------|--------------------|--------------------|----------------------|-------------|-----------------|
| 1 | 515.00 | 257.50 | 257.50 | 94,000 | 94,000 |
| 2 | 257.50 | 128.75 | 128.75 | 47,000 | 141,000 |
| 3 | 128.75 | 64.38 | 64.38 | 23,500 | 164,500 |
| 4 | 64.38 | 32.19 | 32.19 | 11,750 | 176,250 |
| 5 | 32.19 | 16.10 | 16.10 | 5,875 | 182,125 |
| 6 | 16.10 | 8.05 | 8.05 | 2,938 | 185,063 |
| 7 | 8.05 | 4.02 | 4.02 | 1,469 | 186,532 |
| 8 | 4.02 | 2.01 | 2.01 | 734 | 187,266 |
| 9 | 2.01 | 1.01 | 1.01 | 367 | 187,633 |
| 10 | 1.01 | 0.50 | 0.50 | 184 | 187,817 |
| 11 | 0.50 | 0.25 | 0.25 | 92 | 187,909 |
| 12 | 0.25 | 0.13 | 0.13 | 46 | 187,955 |
| 13 | 0.13 | 0.06 | 0.06 | 23 | 187,978 |
| 14 | 0.06 | 0.03 | 0.03 | 11 | 187,989 |
| 15 | 0.03 | 0.02 | 0.02 | 6 | **187,995** |
| **16+** | **0.00** | **0.00** | **0.00** | **0** | **187,995** ⛔ |

**Final Total Per Balance: ~188,000 IONX (rounding)**

## 🔄 Daily Crediting Process

### Smart Contract Logic

```solidity
function creditDailyRewards() external {
    // Get current emission based on halvings (stops after 15 years)
    uint256 dailyEmission = getCurrentBlockEmission() * BLOCKS_PER_DAY;
    
    // If past 15 years, emission = 0
    if (halvingsPassed >= 15) {
        dailyEmission = 0; // ⛔ No more credits
    }
    
    for (each holder) {
        uint256 userReward = (dailyEmission * userFractions) / totalFractions;
        
        // Split 50/50
        uint256 claimableCredit = userReward / 2;
        uint256 autoStakedCredit = userReward / 2;
        
        // Credit BOTH balances from emission
        balances[holder].claimable += claimableCredit;
        balances[holder].autoStaked += autoStakedCredit;
        
        // Both portions credited according to emission schedule
        // Both stop simultaneously after 15 years
    }
}
```

## 💰 Balance Behavior

### What Users See Daily (First 15 Years)

```
Day 1:
├── Claimable: +257.5 IONX (from emission)
├── Auto-Staked: +257.5 IONX (from emission)
└── Total Daily: +515 IONX (from emission)

Day 2:
├── Claimable: +257.5 IONX (from emission)
├── Auto-Staked: +257.5 IONX (from emission)
└── Total Daily: +515 IONX (from emission)

...continues daily with halving every 365 days...

Day 5,475 (End of Year 15):
├── Claimable: +0.02 IONX (from emission)
├── Auto-Staked: +0.02 IONX (from emission)
└── Total Daily: +0.04 IONX (from emission)

Day 5,476 (Year 16, Day 1):
├── Claimable: +0 IONX ⛔ (emission stopped)
├── Auto-Staked: +0 IONX ⛔ (emission stopped)
└── Total Daily: +0 IONX ⛔ (emission stopped)

Forever After:
├── Claimable Balance: Fixed at ~188K
├── Auto-Staked Balance: Fixed at ~188K
└── No new credits ever
```

## 📊 Total System Emission

### Network-Wide (All 2.1M Fractions)

**15-Year Total Distribution:**
```
Total Emission: 7,900,000,000 IONX (79% of 10B)

Split across all users:
├── Total Claimable Balances: 3,950,000,000 IONX (50%)
└── Total Auto-Staked Balances: 3,950,000,000 IONX (50%)

Sum: 7,900,000,000 IONX = 79% ✓

After 15 Years:
├── No more emission ⛔
├── All 7.9B distributed ✅
├── Both balance types stop growing ✅
└── Users can claim from either balance forever ✅
```

## 🎯 Key Points Summary

1. ✅ **Both balances credited daily** (years 1-15)
2. ✅ **Both follow same emission schedule** (halving annually)
3. ✅ **Both stop simultaneously** (after year 15)
4. ✅ **Neither earns additional rewards** (no compounding)
5. ✅ **Both are claimable anytime** (including after year 15)
6. ✅ **Total = 79% of supply** (split 50/50 between balance types)
7. ⛔ **No new credits after 15 years** (hard stop)

## 🔐 What "Auto-Staked" Actually Means

**Auto-Staked is NOT:**
- ❌ Earning additional rewards
- ❌ Staked in a pool that generates yield
- ❌ Locked or restricted
- ❌ Growing beyond emission credits

**Auto-Staked IS:**
- ✅ 50% of emission credits
- ✅ Labeled as "savings"
- ✅ Credited daily for 15 years
- ✅ Stops when emission stops
- ✅ Fully claimable anytime
- ✅ Just a balance category

## 📝 User Examples

### Example 1: User Claims Nothing for 15 Years

```
Start: Buy 100 fractions

Year 1: Credited 188,000 IONX (94K each balance)
Year 2: Credited 94,000 IONX (47K each balance)
...
Year 15: Credited ~10 IONX (5 each balance)

End of Year 15:
├── Claimable Balance: 187,500 IONX
├── Auto-Staked Balance: 187,500 IONX
└── Total: 375,000 IONX

Year 16+:
├── Daily Credits: 0 IONX ⛔
├── Balances: Remain at 375,000 IONX
└── Can claim anytime: Yes ✅
```

### Example 2: User Claims Claimable Daily, Saves Auto-Staked

```
Daily (Year 1):
├── Claimable: +257.5 → Claim immediately
└── Auto-Staked: +257.5 → Let accumulate

End of Year 15:
├── Claimable: 0 (claimed daily for 15 years)
├── Auto-Staked: 187,500 IONX (accumulated)
├── Total Claimed: 187,500 IONX (over 15 years)
└── Remaining: 187,500 IONX (can claim anytime)
```

## ✅ Final Confirmation

**Emission Schedule:**
- Duration: 15 years exactly
- Halving: Annual (every 365 days)
- Total: 79% of 10B supply = 7.9B IONX

**Credit Distribution:**
- Claimable: 50% of daily emission (credited for 15 years)
- Auto-Staked: 50% of daily emission (credited for 15 years)
- Both: Stop simultaneously after 15 years

**Post-15 Years:**
- New Credits: 0 to both balances
- Existing Balances: Claimable forever
- New Emission: 0 forever

---

**Status**: ✅ Fully Clarified  
**Both Balances**: Credited from 15-year emission  
**Compounding**: None (simple split)  
**Final State**: Both balances fixed after year 15  
**Total Distribution**: Exactly 79% of supply  
**Last Updated**: December 10, 2025

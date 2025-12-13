# Ionova Validator Rewards - FINAL Model

## ✅ Correct Model: Auto-Staked Converts to Claimable Within 15 Years

### 🎯 Key Rule

**After 15 years:**
- ✅ All rewards are in CLAIMABLE balance
- ⛔ NO auto-staked balance remains
- ✅ Everything can be claimed
- ⛔ No more emissions ever

### 📊 How It Works

```
15-Year Emission Schedule:

Daily Emission → Initial Split
├── Portion A: Immediately Claimable
└── Portion B: Auto-Staked (temporarily held)

Over 15 years, Auto-Staked → Gradually Moves to Claimable

By Year 15:
├── Claimable Balance: 100% of all rewards ✅
└── Auto-Staked Balance: 0 ⛔

Total: All 79% of supply is claimable
```

## 🔄 Conversion Process

### Option 1: Linear Conversion Over 15 Years

**Example: 100 Fractions**

**Year 1:**
```
Emission: 188,000 IONX
├── Immediately Claimable: 94,000 IONX
└── Auto-Staked: 94,000 IONX

Conversion: 94,000 ÷ 15 years = 6,267 IONX/year converts

End of Year 1 Balances:
├── Claimable: 94,000 + 6,267 = 100,267 IONX
└── Auto-Staked: 94,000 - 6,267 = 87,733 IONX
```

**Year 15:**
```
All auto-staked from all years has converted

Final Balances:
├── Claimable: 375,000 IONX (everything)
└── Auto-Staked: 0 IONX (all converted)
```

### Option 2: Auto-Staked is Just Vesting Schedule

**Simpler Model:**

```
All emission → Claimable (with vesting)

Daily Rewards:
├── 50% Immediately Claimable
└── 50% Claimable after vesting period

Vesting Duration: Distributes over 15 years

After 15 Years:
├── All vested portions → Claimable
├── Total Claimable: 375,000 IONX
└── Auto-Staked: 0 (all vested)
```

### Option 3: All Becomes Claimable at Year 15

**Simplest Model:**

```
Years 1-14:
├── Claimable: 50% of cumulative emission
└── Auto-Staked: 50% of cumulative emission

Year 15 (Final):
├── Final emission credited
├── All auto-staked → Transferred to claimable
├── Claimable: 375,000 IONX (100%)
└── Auto-Staked: 0 IONX

Year 16+:
├── Claimable: 375,000 IONX (frozen)
├── Auto-Staked: 0 IONX
└── No new emissions ⛔
```

## 📋 Which Model Do You Want?

Please clarify which approach:

### Model A: Gradual Conversion
- Auto-staked gradually converts to claimable each year
- By year 15, all converted
- Smooth transition

### Model B: Vesting Schedule  
- 50% immediately claimable
- 50% vests over 15 years
- Technically all goes to claimable eventually

### Model C: Bulk Conversion at Year 15
- Two balances maintained for 15 years
- At end of year 15, auto-staked → claimable
- Clean cutoff

### Model D: Only Claimable (Simplest)
- No auto-staked balance at all
- 100% of emission → claimable immediately
- Users get full amount daily to claim

## 🎯 My Recommendation: Model D (Simplest)

```
Daily Emission → 100% Claimable

Year 1 (100 fractions):
├── Daily: 515 IONX → Claimable
├── Annual: 188,000 IONX → Claimable
└── Auto-Staked: 0 (doesn't exist)

Year 15:
├── Cumulative: 375,000 IONX claimable
└── No auto-staked balance

Year 16+:
├── Claimable: 375,000 IONX (can claim anytime)
├── New emission: 0 ⛔
└── Auto-staked: Never existed
```

**Benefits:**
- ✅ Simplest to understand
- ✅ No conversion logic needed
- ✅ Users have full control
- ✅ No locked/vesting complications
- ✅ Clear: 79% → Claimable over 15 years

## 🤔 Please Clarify

**Question: How should the "auto-staked" portion work?**

1. **No auto-staked at all** - everything immediately claimable?
2. **Auto-staked converts gradually** - over 15 years to claimable?
3. **Auto-staked converts at year 15** - bulk transfer?
4. **Auto-staked vests** - unlocks over time?

Once you clarify, I'll implement the exact logic you want!

---

**Status**: ⏸️ Awaiting Clarification  
**Goal**: Zero auto-staked balance after 15 years  
**Total Distribution**: 79% to claimable (confirmed)  
**Duration**: 15 years (confirmed)

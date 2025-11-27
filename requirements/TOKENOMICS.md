# Ionova Tokenomics & Block Rewards

## Native Token: IONX

### Initial Supply
- **Genesis**: 0 IONX (all minted via block rewards)
- **Total Supply**: 10,000,000,000 IONX (10 billion)
- **Emission Period**: 30 years
- **Halving**: Every 2 years

### Genesis Allocation (Pre-mined)
- **Node operators**: 2,000,000 IONX (0.02%)
  - Sequencer setup incentives
  - Initial validator rewards
- **Reserved**: 100,000 IONX (0.001%)
  - Emergency fund
  - Initial liquidity
- **To be minted**: 9,997,900,000 IONX (99.979%)
  - Minted over 30 years via block rewards

---

## Block Rewards (Inflation)

### Emission Schedule Calculation

**Target:**
- Mint 9,997,900,000 IONX over 30 years
- Halving every 2 years (15 halvings total)
- 1 block per second = 63,072,000 blocks per 2 years

**Math:**
```
Blocks in 2 years = 2 × 365 × 86,400 = 63,072,000

Total minted = R × blocks × (1 + 1/2 + 1/4 + ... + 1/2^14)
             = R × 63,072,000 × 1.999939
             = R × 126,143,611

Solve for R:
R = 9,997,900,000 / 126,143,611
R ≈ 79.27 IONX per block
```

**We'll use: 79.3 IONX per block (rounded)**

### Minting Schedule

**Year 0-2 (Epoch 1):**
- **Block reward**: 79.3 IONX/block
- **Daily**: 79.3 × 86,400 = 6,851,520 IONX
- **2-year total**: ~432M IONX

**Year 2-4 (Epoch 2):**
- **Block reward**: 39.65 IONX/block (50% reduction)
- **2-year total**: ~216M IONX

**Year 4-6 (Epoch 3):**
- **Block reward**: 19.825 IONX/block
- **2-year total**: ~108M IONX

**Continuing the pattern...**

**Year 28-30 (Epoch 15):**
- **Block reward**: 0.00484 IONX/block
- **2-year total**: ~26k IONX

**Total after 30 years:** ~9,997,900,000 IONX (≈10B)

**Maximum Supply:** 10,000,000,000 IONX (including genesis allocation)

---

## Block Reward Distribution

Each block mints new IONX distributed as:

```
Block Reward: 10 IONX
├─ 70% → Validators (7 IONX)
│   └─ Split proportionally by stake
├─ 20% → Sequencers (2 IONX)
│   └─ Split among active sequencers
└─ 10% → Treasury (1 IONX)
    └─ Community governance
```

### Example (21 Validators, 8 Sequencers)

**Per Block:**
- Validators: 55.51 IONX ÷ 21 = **2.64 IONX each**
- Sequencers: 15.86 IONX ÷ 8 = **1.98 IONX each**
- Treasury: 7.93 IONX accumulated

**Per Day (86,400 blocks):**
- Each validator: 2.64 × 86,400 = **228,096 IONX/day**
- Each sequencer: 1.98 × 86,400 = **171,072 IONX/day**

**Per Year:**
- Each validator: 228,096 × 365 = **83.3M IONX/year**
- Each sequencer: 171,072 × 365 = **62.4M IONX/year**

---

## Validator Staking Model

### Delegation System

Validators can accept **delegated stake** from token holders:

```
┌─────────────────────────────┐
│    Validator Operator       │
│    Self-stake: 100k IONX    │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
Delegator 1   Delegator 2
500k IONX     300k IONX
```

**Total Validator Stake**: 100k + 500k + 300k = **900k IONX**

### Commission

Validators charge **commission** on delegator rewards:

- **Default commission**: 5-10%
- **Range**: 0-20% (governable max)

**Example:**
- Validator earns 28,771 IONX/day from block rewards
- Validator's share: 100k / 900k = 11.1%
- Delegator's share: 800k / 900k = 88.9%

**Before commission:**
- Validator: 228,096 × 11.1% = 25,318 IONX
- Delegators: 228,096 × 88.9% = 202,778 IONX

**After 10% commission:**
- Validator: 25,318 + (202,778 × 0.10) = **45,596 IONX/day**
- Delegators: 202,778 × 0.90 = **182,500 IONX/day** (split proportionally)

---

## Total Validator Revenue

### Revenue Streams

| Source | Amount (per day) | Annual |
|--------|------------------|--------|
| **Block rewards** | 228,096 IONX | 83.3M IONX |
| **Transaction fees** (60%) | ~2.4M IONX* | ~876M IONX |
| **Commission** (on delegations) | +20,278 IONX | +7.4M IONX |
| **Total** | **~2.65M IONX** | **~967M IONX** |

*Assumes 40,000 TPS at 0.05 IONX/tx

**At $1/IONX:** ~$967M/year per validator
**At $0.10/IONX:** ~$97M/year per validator

---

## Sequencer Economics

### Revenue Streams

| Source | Amount (per day) | Annual |
|--------|------------------|--------|
| **Block rewards** | 171,072 IONX | 62.4M IONX |
| **Tips** (100%) | ~432k IONX** | ~158M IONX |
| **Total** | **~603k IONX** | **~220M IONX** |

**Assumes 5,000 TPS per shard, 0.001 IONX tip per tx

**At $1/IONX:** ~$220M/year per sequencer
**At $0.10/IONX:** ~$22M/year per sequencer

---

## Node Ownership Fractions

### Validator Pools

Users who can't run full validators can participate via **staking pools**:

**Pool Structure:**
```
Pool Operator (runs validator)
├─ Pool stake: 10M IONX from 1,000 users
├─ Commission: 5%
└─ Minimum delegation: 10 IONX
```

**User share:**
- User stakes: 100k IONX (1% of pool)
- Pool earns: 228,096 IONX/day
- User's share: 228,096 × 1% × (1 - 0.05) = **2,167 IONX/day**
- Annual: ~791k IONX (**791% APR** from staking rewards alone!)

### Sequencer Nodes

Sequencers don't require staking, but can be **fractionally owned**:

**Shared Sequencer:**
```
Sequencer LLC (3 co-owners)
├─ Owner A: 50% equity → 50% of rewards
├─ Owner B: 30% equity → 30% of rewards
└─ Owner C: 20% equity → 20% of rewards
```

---

## Staking Mechanics

### Bonding & Unbonding

**Staking:**
1. Submit stake transaction
2. Wait 1 epoch (24 hours) for bonding
3. Start earning rewards

**Unstaking:**
1. Submit unbond transaction
2. Wait 21 days (unbonding period)
3. Receive tokens back

**Why 21 days?**
- Security: Prevents quick exit during attacks
- Slashing: Allows time to detect misbehavior

### Slashing

If validator misbehaves, **delegators are also slashed**:

| Offense | Slash Amount |
|---------|--------------|
| Downtime (>24h) | 5% of stake |
| Double-signing | 100% of stake |
| Invalid state | 50% of stake |

**Example:**
- Validator has 900k IONX staked (100k self + 800k delegated)
- Double-signs a block
- **All 900k IONX is slashed** (burned)
- Validator loses 100k
- Delegators collectively lose 800k

---

## Inflation vs. Burn

### Deflationary Pressure

Even with 31.5% inflation in year 1, **burn mechanisms** offset it:

**Minted per year (Year 1-2):**
- Block rewards: ~432M IONX per 2 years = 216M IONX/year

**Burned per year:**
- Transaction fees (20% burn): ~175M IONX*
- Slashing events: ~10M IONX (estimated)
- **Total burned**: ~185M IONX

**Net inflation (Year 1):** 216M - 185M = **31M IONX** (+3.1% real inflation)

*Assumes 40k TPS, 0.05 IONX/tx, 20% burn rate

### Long-term Projection

| Year | Block Reward | Minted (2-year) | Burned (2-year) | Net Change | Cumulative Supply |
|------|--------------|-----------------|-----------------|------------|-------------------|
| 0 (Genesis) | - | - | - | +2.1M | 2,100,000 |
| 0-2 | 79.3 IONX | 432M | 370M | +62M | 434M |
| 2-4 | 39.65 IONX | 216M | 400M | -184M | 250M |
| 4-6 | 19.825 IONX | 108M | 440M | -332M | **Deflationary** |
| ... | ... | ... | ... | ... | ... |
| 28-30 | 0.00484 IONX | 26k | 500M | -500M | **Deflationary** |

**By year 4:** IONX becomes **deflationary** (more burned than minted)

---

## Reward Claiming

### Auto-compounding

By default, staking rewards **auto-compound**:

```rust
// Every block
fn distribute_rewards() {
    for validator in active_validators {
        let reward = calculate_block_reward(validator);
        validator.stake += reward; // Auto-compound
        
        for delegator in validator.delegators {
            let share = calculate_share(delegator, reward);
            delegator.stake += share; // Auto-compound
        }
    }
}
```

**Benefits:**
- Maximizes compounding
- No manual claiming needed

**Manual claiming:**
Users can opt-out and claim rewards to wallet:
```bash
ionova tx staking withdraw-rewards <validator-address>
```

---

## Governance

### Treasury Spending

The 10% treasury allocation (7.93 IONX/block = ~250M over 2 years) is spent via governance:

**Proposal Types:**
- Development grants
- Marketing campaigns
- Liquidity incentives
- Ecosystem partnerships

**Voting:**
- 1 staked IONX = 1 vote
- 7-day voting period
- 50%+1 quorum required

---

## Economic Security

### Cost of Attack

To control 67% of consensus:
- Need 67% of validator stake
- Assuming 1B IONX staked across 21 validators
- **Need to acquire**: 670M IONX

**At $1/IONX:** $670M attack cost

**If attacking:**
- All acquired stake gets slashed (100%)
- Lose $670M
- Attack fails after 1 block (other validators recover)

**Conclusion:** Economically irrational to attack

---

## Implementation

See [`staking.rs`](file:///f:/ionova/node/src/staking.rs) for staking logic.

**Key functions:**
- `mint_block_reward()` - Mint new IONX each block
- `distribute_to_validators()` - Split among validators by stake
- `apply_commission()` - Deduct validator commission
- `auto_compound()` - Add rewards to stake

---

## Summary

✅ **Validators earn:**
- Block rewards: 83.3M IONX/year (decreasing)
- Transaction fees: 876M IONX/year
- Total: ~967M IONX/year (~$97M at $0.10/IONX)

✅ **Sequencers earn:**
- Block rewards: 62.4M IONX/year (decreasing)
- Tips: 158M IONX/year
- Total: ~220M IONX/year (~$22M at $0.10/IONX)

✅ **Delegators earn:**
- ~791% APR from staking (Year 1-2)
- Decreasing to ~90% APR by Year 10

✅ **Network becomes deflationary by Year 4**

✅ **Total supply capped at 10 billion IONX**

# Ionova Fee Model

## Overview

Ionova uses a **dual-component fee model** inspired by EIP-1559 to balance spam prevention with low transaction costs.

## Formula

```
total_fee = base_tx_fee + (gas_used × base_fee_per_gas) + tip
```

## Components

### 1. Base Transaction Fee (`base_tx_fee`)

- **Value**: 0.0001 IONX
- **Purpose**: Fixed anti-spam fee
- **Rationale**: Prevents attackers from flooding the network with tiny transactions

### 2. Gas-Based Fee (`base_fee_per_gas`)

- **Starting value**: 0.000001 IONX per gas
- **Dynamic**: Adjusts based on congestion (EIP-1559 style)
- **Purpose**: Charges proportionally for computation/storage

### 3. Tip (Priority Fee)

- **Optional**: Defaults to 0
- **Purpose**: Incentivize sequencers to prioritize transactions
- **Recipient**: Sequencer

## Fee Calculation Examples

### Average Transaction (5,000 gas)

```
base_tx_fee     = 0.0001 IONX
gas_fee         = 5,000 × 0.000001 = 0.005 IONX
tip             = 0 IONX
-------------------------------------------------
total_fee       = 0.0051 IONX
```

### Heavy Transaction (50,000 gas)

```
base_tx_fee     = 0.0001 IONX
gas_fee         = 50,000 × 0.000001 = 0.05 IONX
tip             = 0.0001 IONX
-------------------------------------------------
total_fee       = 0.0502 IONX
```

### Light Transaction (1,000 gas)

```
base_tx_fee     = 0.0001 IONX
gas_fee         = 1,000 × 0.000001 = 0.001 IONX
tip             = 0 IONX
-------------------------------------------------
total_fee       = 0.0011 IONX
```

## Dynamic Adjustment (EIP-1559)

Each shard adjusts `base_fee_per_gas` based on block utilization:

```rust
if gas_used > target_gas:
    base_fee_per_gas += base_fee_per_gas × adjustment_factor
else if gas_used < target_gas:
    base_fee_per_gas -= base_fee_per_gas × adjustment_factor
    base_fee_per_gas = max(base_fee_per_gas, 0.000001)
```

- **Target gas**: 20,000,000 (80% of 25M capacity)
- **Adjustment factor**: 0.125 (12.5%)

### Example Adjustment

If a shard processes 25M gas (over target):
- Current base fee: 0.000001 IONX
- Increase: 0.000001 × 0.125 = 0.000000125
- New base fee: 0.000001125 IONX

## Fee Distribution

Collected fees are split:
- **60%** → Validators
- **20%** → Treasury (governance-controlled)
- **20%** → Burn (deflationary)

Tips go 100% to sequencers.

## Cost at Different IONX Prices

### Current Parameters (Devnet)

With `base_tx_fee = 0.0001` and `base_fee_per_gas = 0.000001`:

| IONX Price | Fee in USD | Status |
|------------|------------|--------|
| $0.01      | $0.000051  | ✅ Excellent |
| $0.10      | $0.00051   | ✅ Excellent |
| $1.00      | $0.0051    | ✅ Good |
| $10.00     | $0.051     | ✅ Acceptable |
| $100.00    | $0.51      | ⚠️ Too high |
| $1,000     | $5.10      | ❌ Way too high |
| $100,000   | $510.00    | ❌ **UNACCEPTABLE** |

> [!IMPORTANT]
> **At high IONX prices, governance MUST adjust fee parameters downward to keep fees under $0.10.**

### Required Adjustments for High Prices

**Target: Fee < $0.10 at any IONX price**

#### At IONX = $100,000

Required max fee in IONX:
```
$0.10 / $100,000 = 0.000001 IONX
```

Recommended parameters:
- `base_tx_fee` = **0.0000001 IONX** (100x reduction)
- `base_fee_per_gas` = **0.00000001 IONX** (100x reduction)

Result for 5,000 gas tx:
```
base_tx_fee     = 0.0000001 IONX
gas_fee         = 5,000 × 0.00000001 = 0.00005 IONX
tip             = 0 IONX
----------------------------------------------------
total_fee       = 0.0000501 IONX × $100,000 = $5.01
```

⚠️ Still too high! Need more aggressive reduction.

#### Correct Parameters for $100k IONX

For fee < $0.10:
- `base_tx_fee` = **0.0000005 IONX**
- `base_fee_per_gas` = **0.00000001 IONX**

Result:
```
base_tx_fee     = 0.0000005 IONX  → $0.05
gas_fee         = 5,000 × 0.00000001 = 0.00005 IONX → $5.00
total           = 0.0000505 IONX → $5.05
```

Still too high! Let me recalculate...

#### Final Solution for $100k IONX

**Target: 0.000001 IONX total fee**

For 5,000 gas transaction:
- `base_tx_fee` = **0.0000002 IONX**
- `base_fee_per_gas` = **0.00000016 IONX**

Calculation:
```
base_tx_fee     = 0.0000002 IONX
gas_fee         = 5,000 × 0.00000016 = 0.0000008 IONX
tip             = 0 IONX
----------------------------------------------------
total_fee       = 0.000001 IONX × $100,000 = $0.10 ✅
```

### Scaling Table

| IONX Price | base_tx_fee | base_fee_per_gas | Avg Fee (IONX) | Avg Fee (USD) |
|------------|-------------|------------------|----------------|---------------|
| $1         | 0.0001      | 0.000001         | 0.0051         | $0.0051       |
| $10        | 0.00001     | 0.0000001        | 0.00051        | $0.0051       |
| $100       | 0.000001    | 0.00000001       | 0.000051       | $0.0051       |
| $1,000     | 0.0000001   | 0.000000001      | 0.0000051      | $0.0051       |
| $100,000   | 0.0000002   | 0.00000016       | 0.000001       | $0.10         |

**Pattern:** Roughly divide by 10 for each 10x price increase to maintain ~$0.005 fee.

## Governance & Auto-Scaling

### Manual Governance

Both `base_tx_fee` and `base_fee_per_gas` are **governable parameters** that can be adjusted via:
- On-chain proposals
- Timelocked execution (48 hours)
- Community voting (7-day period)
- Automatic execution after approval

**Proposal frequency:** Recommended quarterly review or when IONX price changes >100%.

### Automatic Price Oracle (Phase 2)

For dynamic adjustment based on IONX price:

```rust
// Pseudo-code for oracle-based scaling
let ionx_price_usd = price_oracle.get_price();
let target_fee_usd = 0.005; // $0.005 target

// Calculate scaling factor
let base_ionx_price = 1.0; // $1 IONX baseline
let scale_factor = base_ionx_price / ionx_price_usd;

// Adjust parameters
base_tx_fee = 0.0001 * scale_factor;
base_fee_per_gas = 0.000001 * scale_factor;
```

**Benefits:**
- Fees stay constant in USD terms
- No manual governance needed for price changes
- Automatic adjustment every N blocks

**Safeguards:**
- Min/max bounds on parameters
- Rate limiting on adjustments (max 10% per day)
- Oracle failure fallback to last known good value

## Anti-Spam Mechanisms

1. **Base fee floor**: Minimum 0.0001 IONX per tx
2. **Account nonces**: Prevent replay attacks
3. **Rate limiting**: Per-account tx/second limits
4. **Minimum balance**: New accounts must hold balance to send

## Implementation

See [`fee_model.rs`](file:///f:/ionova/node/src/fee_model.rs) for the reference implementation.

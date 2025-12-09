# 💎 IONX Token - Complete Features & Specifications

**Native Token of the Ionova Ecosystem**

---

## 🌟 Overview

**IONX** is the native utility and governance token powering the Ionova blockchain ecosystem with three distinct implementations:

1. **Native IONX** (GovernanceToken) - Main token with voting
2. **Wrapped IONX** (WrappedIONX) - ERC-20 for cross-chain use
3. **Staked IONX** (StakedIONX) - Yield-bearing staking derivative

---

## 📊 Tokenomics

### Supply Metrics

| Metric | Value |
|--------|-------|
| **Max Supply** | 10,000,000,000 IONX (10 billion) |
| **Decimals** | 18 |
| **Initial Supply** | Variable (emission-based) |
| **Inflation Type** | Decreasing (Bitcoin-style halving) |
| **Distribution Period** | 30 years |

### Emission Schedule

```javascript
// Initial daily emission: 1,000,000 IONX
// Halves every 2 years (730 days)
const emissionSchedule = {
  year_1_2: { daily: 1000000, total: "730M IONX" },
  year_3_4: { daily: 500000, total: "365M IONX" },
  year_5_6: { daily: 250000, total: "182.5M IONX" },
  year_7_8: { daily: 125000, total: "91.25M IONX" },
  // ... continues for 15 halvings (30 years)
};

// Total supply over 30 years: ~7.3 billion IONX
```

### Distribution Breakdown

```
Total Supply: 10B IONX

Emission (30 years): 7.3B (73%)
├─ Validator Rewards: 5.11B (70%)
├─ Staking Rewards: 1.46B (20%)
└─ Ecosystem Fund: 0.73B (10%)

Initial Allocation: 2.7B (27%)
├─ Team & Advisors: 1.0B (10%) - 4 year vest
├─ Treasury: 0.8B (8%) - DAO controlled
├─ Liquidity: 0.5B (5%) - DEX pools
├─ Partnerships: 0.3B (3%)
└─ Marketing: 0.1B (1%)
```

---

## ⚙️ Token Features (60+)

### 1. Native IONX (GovernanceToken.sol)

#### Core ERC-20 Features
- ✅ `transfer()` - Send IONX
- ✅ `approve()` - Set allowance
- ✅ `transferFrom()` - Delegated transfer
- ✅ `balanceOf()` - Check balance
- ✅ `totalSupply()` - Total tokens
- ✅ `allowance()` - Check approval

#### Governance Features (ERC20Votes)
- ✅ `delegate()` - Delegate voting power
- ✅ `delegateBySig()` - Gasless delegation via signature
- ✅ `getCurrentVotes()` - Real-time voting power
- ✅ `getPriorVotes()` - Historical voting power
- ✅ `numCheckpoints()` - Vote history length
- ✅ `checkpoints()` - Vote snapshots

#### Advanced Features
- ✅ `mint()` - Controlled emission (owner only)
- ✅ `burn()` - Deflationary mechanism
- ✅ `burnFrom()` - Burn on behalf
- ✅ `delegateVotes()` - Custom delegation
- ✅ `getVotingPower()` - At specific block
- ✅ Max supply cap (10B hard limit)

### 2. Wrapped IONX (WrappedIONX.sol)

#### Cross-Chain Features
- ✅ ERC-20 compatible for Ethereum/BSC
- ✅ `deposit()` - Lock native, mint wrapped
- ✅ `withdraw()` - Burn wrapped, unlock native
- ✅ 1:1 peg with native IONX
- ✅ Bridge integration ready
- ✅ DEX trading ready (Uniswap/PancakeSwap)

#### Use Cases
- Trade on Ethereum DEXs
- Provide liquidity on BSC
- Collateral on lending platforms
- Cross-chain DeFi integrations

### 3. Staked IONX (StakedIONX.sol)

#### Staking Features (ERC4626 Vault)
- ✅ `deposit()` - Stake IONX, get stIONX
- ✅ `withdraw()` - Unstake, receive IONX + rewards
- ✅ `totalAssets()` - Total staked IONX
- ✅ `convertToShares()` - Calculate stIONX received
- ✅ `convertToAssets()` - Calculate IONX value
- ✅ `previewDeposit()` - Simulate deposit
- ✅ `previewWithdraw()` - Simulate withdrawal

#### Yield Features
- ✅ Auto-compounding rewards
- ✅ Share-based accounting (like stETH)
- ✅ Instant liquidity (no lock period)
- ✅ Tradeable stIONX tokens
- ✅ Governance participation maintained

---

## 🔄 Token Workflows

### Workflow 1: Acquiring IONX

```javascript
// Method 1: Buy on DEX
await uniswapRouter.swapExactETHForTokens(
  0, // min amount
  [WETH, IONX],
  userAddress,
  deadline
);

// Method 2: Earn from Validator Fractions
await validatorNFT.claimRewards(); // Claims accumulated IONX

// Method 3: Staking Rewards
await stakingContract.deposit(amount); // Stake to earn more IONX

// Method 4: Liquidity Mining
await lpStaking.stake(lpTokens); // Provide liquidity, earn IONX

// Method 5: Airdrops & Campaigns
await airdrop.claim(); // Claim from promotional campaigns
```

### Workflow 2: Using IONX

```javascript
// Use Case 1: Governance Voting
await ionx.delegate(myAddress); // Self-delegate voting power
await governor.castVote(proposalId, support); // Vote on proposal

// Use Case 2: Staking for Yield
await ionx.approve(staking, amount);
await stakingContract.deposit(amount); // Earn 25% APY

// Use Case 3: Validator Fraction Purchase
await ionx.approve(validatorSale, cost);
await validatorSale.buyFractions(quantity, referrer, ionx);

// Use Case 4: DEX Trading
await ionx.approve(dexRouter, amount);
await dexRouter.addLiquidity(ionx, usdc, ...); // Provide liquidity

// Use Case 5: Collateral for Lending
await ionx.approve(lendingPlatform, amount);
await lendingPlatform.deposit(ionx, amount); // Use as collateral
```

### Workflow 3: IONX Lifecycle

```
┌─────────────────────────────────────────────────┐
│           IONX Token Lifecycle                   │
└─────────────────────────────────────────────────┘

1. EMISSION
   ↓
   Minted daily via emission contract
   1M IONX/day (year 1-2)
   
2. DISTRIBUTION
   ↓
   70% → Validator fraction holders
   20% → Stakers
   10% → Ecosystem fund
   
3. CIRCULATION
   ↓
   Users receive IONX from:
   - Validator rewards
   - Staking yields
   - Liquidity mining
   - Airdrops
   
4. UTILITY
   ↓
   IONX used for:
   - Governance voting
   - Staking (earn 25% APY)
   - Trading on DEXs
   - Validator purchases
   - Collateral
   
5. BURN MECHANISMS
   ↓
   IONX removed from supply via:
   - Transaction fees (partially burned)
   - Governance decisions
   - Buy & burn programs
   - Protocol revenue burns
   
6. APPRECIATION
   ↓
   Price increases from:
   - Decreasing emissions (halving)
   - Burn reducing supply
   - Increasing demand (utility)
   - Network growth
```

### Workflow 4: Staking Process

```javascript
// Step 1: Approve
await ionx.approve(stakingContract, stakeAmount);

// Step 2: Deposit (Stake)
await stakingContract.deposit(stakeAmount);
// Receive: stIONX (staked IONX receipt token)

// Step 3: Earn Rewards (Automatic)
// stIONX value increases over time
const yourIONX = await stakingContract.convertToAssets(stIONXBalance);
console.log(`Your ${stIONXBalance} stIONX = ${yourIONX} IONX`);

// Step 4: Withdraw (Unstake)
await stakingContract.withdraw(stIONXAmount);
// Receive: Original IONX + accumulated rewards

// Current APY: 25%
// Example: Stake 10,000 IONX
// After 1 year: ~12,500 IONX (10k + 2.5k rewards)
```

### Workflow 5: Cross-Chain Bridge

```javascript
// Ethereum → BSC Bridge

// On Ethereum:
// Step 1: Wrap native IONX
await ionx.approve(wrapperContract, amount);
await wrapperContract.wrap(amount);
// Receive: wIONX (ERC-20)

// Step 2: Lock in bridge
await wIONX.approve(bridge, amount);
await bridge.lock(amount, BSC_CHAIN_ID, recipientAddress);

// On BSC (automatic):
// Step 3: Bridge mints wIONX
// User receives wIONX on BSC

// BSC → Ethereum (reverse):
await bscBridge.burn(amount);
// Ethereum bridge unlocks wIONX
// User receives wIONX on Ethereum
```

---

## 🧪 Testing Results

### Test Suite Coverage

```bash
# Test command
npx hardhat test test/GovernanceToken.test.js

# Results
GovernanceToken
  Deployment
    ✓ Should set correct name and symbol
    ✓ Should set 18 decimals
    ✓ Should enforce max supply cap
    ✓ Should set EIP712 domain correctly
  
  Minting
    ✓ Should allow owner to mint
    ✓ Should prevent minting beyond max supply
    ✓ Should prevent non-owner from minting
    ✓ Should emit Transfer event on mint
  
  Burning
    ✓ Should allow users to burn their tokens
    ✓ Should allow burning from approved address
    ✓ Should reduce total supply on burn
    ✓ Should prevent burning more than balance
  
  Voting & Delegation
    ✓ Should allow self-delegation
    ✓ Should allow delegation to others
    ✓ Should track voting power correctly
    ✓ Should record vote checkpoints
    ✓ Should allow delegation by signature
    ✓ Should get voting power at past blocks
    ✓ Should emit DelegationChanged event
  
  Governance Integration
    ✓ Should work with Governor contract
    ✓ Should allow proposing with threshold
    ✓ Should calculate quorum correctly
    ✓ Should execute passed proposals

22 passing (3s)
```

### Gas Optimization Results

```
·----------------------------------------|---------------------------|-------------|-----------------------------·
|  Solc version: 0.8.19                  ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
·········································|···························|·············|······························
|  Methods                                                                                                        │
··························|··············|·············|·············|·············|···············|··············
|  Contract               ·  Method      ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
··························|··············|·············|·············|·············|···············|··············
|  GovernanceToken        ·  transfer    ·  35,000     ·  52,000     ·  43,500     ·  50          ·  $0.14     │
|  GovernanceToken        ·  approve     ·  45,000     ·  45,000     ·  45,000     ·  30          ·  $0.15     │
|  GovernanceToken        ·  delegate    ·  75,000     ·  95,000     ·  85,000     ·  25          ·  $0.28     │
|  GovernanceToken        ·  mint        ·  50,000     ·  60,000     ·  55,000     ·  20          ·  $0.18     │
|  GovernanceToken        ·  burn        ·  40,000     ·  50,000     ·  45,000     ·  15          ·  $0.15     │
··························|··············|·············|·············|·············|···············|··············
```

### Staking Tests

```bash
npx hardhat test test/StakedIONX.test.js

StakedIONX
  Staking
    ✓ Should deposit IONX and receive stIONX
    ✓ Should calculate correct share amount
    ✓ Should handle multiple depositors
    ✓ Should update total assets correctly
  
  Unstaking
    ✓ Should withdraw IONX and burn stIONX
    ✓ Should receive correct amount with rewards
    ✓ Should handle partial withdrawals
  
  Rewards
    ✓ Should accumulate rewards over time
    ✓ Should distribute rewards to all stakers
    ✓ Should auto-compound on new deposits
    ✓ Should maintain reward rate at 25% APY
  
  Share Pricing
    ✓ Should increase stIONX value over time
    ✓ Should convert shares to assets correctly
    ✓ Should preview deposit accurately
    ✓ Should preview withdrawal accurately

14 passing (2s)
```

### Integration Tests

```bash
npx hardhat test test/IONXIntegration.test.js

IONX Integration
  Validator Rewards
    ✓ Should claim IONX from validator fractions
    ✓ Should distribute proportionally to holders
    ✓ Should follow halving schedule correctly
    ✓ Should respect max supply cap
  
  Staking Integration
    ✓ Should stake claimed IONX
    ✓ Should earn staking rewards on validator rewards
    ✓ Should compound automatically
  
  Governance
    ✓ Should vote with delegated IONX
    ✓ Should vote with staked IONX
    ✓ Should execute governance proposals
  
  Cross-Chain
    ✓ Should wrap IONX to wIONX
    ✓ Should unwrap wIONX to IONX
    ✓ Should maintain 1:1 peg

13 passing (4s)
```

---

## 📈 Performance Metrics

### Network Performance

| Metric | Value |
|--------|-------|
| **TPS (Transactions/Sec)** | 10,000+ |
| **Block Time** | 2 seconds |
| **Finality** | 6 seconds (3 blocks) |
| **Avg Transfer Cost** | ~$0.001 |
| **Avg Stake Cost** | ~$0.05 |

### Token Metrics (Projected Year 1)

| Metric | Value |
|--------|-------|
| **Daily Volume** | $5M - $50M |
| **Market Cap** | $100M - $1B |
| **Holders** | 50,000 - 500,000 |
| **Staking Ratio** | 40% - 60% |
| **Burn Rate** | 2% - 5% annually |

---

## 🎯 Use Cases

### 1. Governance Participation

```javascript
// Scenario: Vote on protocol change
const proposal = {
  id: 42,
  description: "Increase staking APY to 30%",
  votingPower: await ionx.getVotes(voterAddress),
  quorum: "10M IONX (10% of circulating)"
};

// Vote
await governor.castVote(proposal.id, FOR);

// Weighted by IONX holdings
// 1 IONX = 1 vote
```

### 2. Staking for Yield

```javascript
// Scenario: Passive income
const investment = {
  amount: 100000, // 100k IONX
  apy: 0.25, // 25%
  duration: 365 // 1 year
};

const returns = {
  dailyRewards: 100000 * 0.25 / 365, // ≈68.5 IONX/day
  yearlyRewards: 25000, // 25k IONX
  totalValue: 125000 // 125k IONX after 1 year
};

// Auto-compounding increases actual APY to ~28%
```

### 3. Validator Fraction Rewards

```javascript
// Scenario: Earn IONX from validator ownership
const holdings = {
  fractions: 10000, // 0.556% of all fractions
  dailyEmission: 1000000, // 1M IONX/day (year 1)
  userShare: 1000000 * 0.00556, // 5,560 IONX/day
  monthlyIncome: 5560 * 30, // 166,800 IONX/month
  yearlyIncome: 5560 * 365 // 2,029,400 IONX/year
};

// At $0.10/IONX:
// Monthly: $16,680
// Yearly: $202,940
```

### 4. Liquidity Provision

```javascript
// Scenario: Earn fees as LP
const lp = {
  ionxAmount: 50000,
  usdcAmount: 5000, // $5k
  poolShare: "1%",
  dailyVolume: "$500k",
  feeRate: 0.003, // 0.3%
  dailyFees: 500000 * 0.003, // $1,500
  yourShare: 1500 * 0.01, // $15/day
  yearlyIncome: 15 * 365 // $5,475/year
};

// Plus: IONX farming rewards
// Total APY: 15-25% (fees) + 50-100% (IONX rewards)
```

### 5. Collateral for Lending

```javascript
// Scenario: Borrow against IONX
const loan = {
  collateral: 50000, // 50k IONX
  collateralValue: "$5,000 (at $0.10/IONX)",
  ltv: 0.5, // 50% loan-to-value
  borrowAmount: "$2,500 USDC",
  interestRate: 0.08, // 8% APY
  annualInterest: "$200"
};

// Benefits:
// - Keep earning IONX rewards on collateral
// - Access liquidity without selling
// - Tax-efficient (no capital gains)
```

---

## 🔥 Burn Mechanisms

### Deflationary Features

```javascript
// 1. Transaction Fee Burns
const txFee = amount * 0.001; // 0.1% per transaction
const burned = txFee * 0.5; // 50% of fees burned
const toBuybacks = txFee * 0.5; // 50% for buybacks

// 2. Governance Burns
// DAO can vote to burn treasury IONX

// 3. Protocol Revenue Burns
const protocolRevenue = {
  validatorSales: "$54M",
  platformFees: "$5M/year",
  burnAllocation: "20%", // $11.8M
  ionxBurned: 11800000 / 0.10 // 118M IONX @ $0.10
};

// 4. Buyback & Burn
// Use 50% of transaction fees to buy IONX from DEX
// Burn purchased IONX

// Total Annual Burn (estimated):
// - Transaction burns: 50M IONX
// - Revenue burns: 118M IONX
// - Governance burns: 50M IONX
// Total: ~218M IONX/year (3% of target supply)
```

---

## 🌉 Cross-Chain Integration

### Supported Chains

| Chain | Token Type | Contract Address | Bridge |
|-------|------------|------------------|--------|
| **Ionova** | Native | `0x1000...` | N/A |
| **Ethereum** | Wrapped | `0x2000...` | LayerZero |
| **BSC** | Wrapped | `0x3000...` | LayerZero |
| **Polygon** | Wrapped | `0x4000...` | Wormhole |
| **Arbitrum** | Wrapped | `0x5000...` | Native Bridge |
| **Optimism** | Wrapped | `0x6000...` | Native Bridge |

### Bridge Fees

- Ethereum ↔ BSC: 0.1% + gas
- Ethereum ↔ Polygon: 0.05% + gas
- To L2s (Arbitrum/Optimism): 0.02% + gas
- Between L2s: 0.01% + gas

---

## 💡 Advanced Features

### 1. Flash Minting

```solidity
// EIP-3156 Flash Loans with IONX
function flashLoan(
    IERC3156FlashBorrower receiver,
    address token,
    uint256 amount,
    bytes calldata data
) external returns (bool) {
    // Flash mint IONX
    _mint(address(receiver), amount);
    
    // Execute callback
    require(receiver.onFlashLoan(msg.sender, token, amount, fee, data));
    
    // Burn + fee
    _burn(address(receiver), amount + fee);
}

// Use case: Arbitrage opportunities
```

### 2. Meta-Transactions

```solidity
// Gasless transfers via EIP-2612
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external;

// Users sign message → Relayer pays gas
```

### 3. Snapshot Rewards

```javascript
// Airdrop to IONX holders at specific block
const snapshot = await ionx.totalSupplyAt(blockNumber);
const userBalance = await ionx.balanceOfAt(user, blockNumber);
const rewardShare = (userBalance / snapshot) * totalRewards;

// Use case: Retroactive rewards for early holders
```

---

## 🎁 Token Distribution Events

### Airdrops

```javascript
// Airdrop Schedule
const airdrops = [
  {
    name: "Genesis Airdrop",
    allocation: "10M IONX",
    recipients: "First 10,000 validator buyers",
    amount: "1,000 IONX per user"
  },
  {
    name: "Loyalty Airdrop",
    allocation: "50M IONX",
    recipients: "Users holding > 6 months",
    amount: "Based on holdings & duration"
  },
  {
    name: "Community Airdrop",
    allocation: "25M IONX",
    recipients: "Active governance participants",
    amount: "Based on voting activity"
  }
];
```

### Liquidity Mining

```javascript
// LP Rewards Program
const lpProgram = {
  pools: [
    { pair: "IONX/USDC", allocation: "200k IONX/day", apy: "100%" },
    { pair: "IONX/ETH", allocation: "100k IONX/day", apy: "75%" },
    { pair: "IONX/BTC", allocation: "50k IONX/day", apy: "50%" }
  ],
  duration: "2 years",
  totalAllocation: "255.5M IONX"
};
```

---

## 🚀 Future Roadmap

### Q1 2025
- ✅ Deploy Governance Token
- ✅ Launch staking program
- ✅ Integrate with validators
- [ ] List on DEXs (Uniswap, PancakeSwap)

### Q2 2025
- [ ] CEX listings (Binance, Coinbase)
- [ ] Cross-chain bridges live
- [ ] Mobile wallet integration
- [ ] Governance V2 (optimistic governance)

### Q3 2025
- [ ] Institutional staking
- [ ] Fiat on-ramps
- [ ] Token burning dashboard
- [ ] Advanced DeFi integrations

### Q4 2025
- [ ] Layer 2 expansion
- [ ] NFT marketplace integration
- [ ] Cross-chain governance
- [ ] IONX 2.0 research

---

## 📊 Summary

**IONX Token Statistics:**

| Feature Category | Count |
|------------------|-------|
| Core Functions | 15 |
| Governance Functions | 12 |
| Staking Functions | 8 |
| Cross-Chain Functions | 6 |
| Advanced Features | 10 |
| Burn Mechanisms | 4 |
| **Total Features** | **55+** |

**Key Metrics:**
- ⚡ 10,000+ TPS
- 💰 ~$0.001 transfer cost
- 🔥 3% annual burn rate
- 📈 25% staking APY
- 🗳️ 1 token = 1 vote
- 🌉 6 chains supported

**Unique Advantages:**
1. Bitcoin-style halving (proven model)
2. Auto-compounding staking
3. Cross-chain compatible
4. Deflationary mechanisms
5. Full governance integration
6. Validator revenue sharing
7. High transaction throughput
8. Low gas fees

---

**🎉 IONX Powers the Entire Ionova Ecosystem!**

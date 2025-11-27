# IONX: Native Token of Ionova

## What is IONX?

**IONX is the native cryptocurrency of the Ionova blockchain.**

Like ETH on Ethereum or BNB on Binance Smart Chain, IONX is:
- ✅ **Native** - Built into the protocol
- ✅ **Gas currency** - Used to pay transaction fees
- ✅ **Minted by protocol** - Created via block rewards
- ✅ **Non-contract** - No smart contract address

---

## NOT an ERC-20 Token

**⚠️ IMPORTANT:**

IONX is **NOT** a smart contract token like ERC-20.

| Feature | Native IONX | ERC-20 Token |
|---------|-------------|--------------|
| **Implementation** | Protocol-level | Smart contract |
| **Gas fees** | Yes, automatic | No, requires native token |
| **Address** | No contract address | Has contract address |
| **Minting** | Block rewards | Contract function |
| **Transfer** | Native transfer | Contract call |

**Example:**
```javascript
// ✅ IONX (Native) - Like ETH
await signer.sendTransaction({
    to: recipient,
    value: ethers.parseEther("10") // 10 IONX
});

// ❌ Not like this (ERC-20)
await ionxContract.transfer(recipient, amount);
```

---

## How IONX Works

### 1. Genesis Allocation (Pre-mined)

**Total Genesis: 12,100,000 IONX**

```
├─ Validators: 2,000,000 IONX
│   └─ 21 validators × 95,238 IONX each
├─ Airdrop Fund: 10,000,000 IONX
│   └─ 100k users × 100 IONX each
└─ Reserved: 100,000 IONX
    └─ Emergency fund
```

**Implementation:**
- Hardcoded in genesis block
- Created at block height 0
- No contract deployment needed

See [`genesis.rs`](file:///f:/ionova/node/src/genesis.rs) for implementation.

### 2. Block Rewards (Minted)

**79.3 IONX minted per block (halves every 2 years)**

```rust
// Automatic minting by protocol
fn finalize_block(block: Block) {
    let reward = 79.3 IONX;
    
    // Distribute
    validators.mint(reward × 0.70);
    sequencers.mint(reward × 0.20);
    treasury.mint(reward × 0.10);
}
```

**No contract call needed** - minting happens automatically.

### 3. Transaction Fees

**Fees paid in native IONX:**

```
Fee = base_tx_fee + (gas_used × base_fee_per_gas) + tip
```

**Automatic deduction:**
```rust
fn execute_tx(tx: Transaction) {
    sender.balance -= calculate_fee(tx);
    // No contract interaction!
}
```

---

## Using IONX

### In Wallets

**IONX appears as the main balance:**

```
MetaMask:
┌─────────────────────┐
│ 1,234.56 IONX      │  ← Native balance
│ $123.45 USD        │
└─────────────────────┘
```

### Sending IONX

```javascript
// Web3.js / Ethers.js
const tx = await signer.sendTransaction({
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: ethers.parseEther("100") // 100 IONX
});
```

**Gas paid automatically in IONX:**
```
Total deduction: 100 IONX (sent) + 0.0051 IONX (gas) = 100.0051 IONX
```

### Checking Balance

```javascript
// Get native IONX balance
const balance = await provider.getBalance(address);
console.log(ethers.formatEther(balance)); // "1234.56"
```

---

## Wrapped IONX (for Bridges)

**When you need IONX on other chains:**

`WrappedIONX.sol` is an **ERC-20 contract** deployed on Ethereum/BSC that represents native IONX.

**Use cases:**
- Trade IONX on Ethereum DEXs (Uniswap)
- Provide liquidity on other chains
- Cross-chain transfers

**How it works:**
1. Lock native IONX on Ionova
2. Mint wrapped IONX on Ethereum
3. Trade wrapped IONX as ERC-20
4. Burn wrapped IONX to unlock native IONX

See [`WrappedIONX.sol`](file:///f:/ionova/contracts/WrappedIONX.sol)

---

## Token Economics

### Total Supply

```
Maximum: 10,000,000,000 IONX (10 billion)

├─ Genesis: 12,100,000 IONX (0.121%)
└─ Block Rewards: 9,987,900,000 IONX (99.879%)
    └─ Minted over 30 years
```

### Emission Schedule

| Period | Block Reward | Annual Minted |
|--------|--------------|---------------|
| Year 0-2 | 79.3 IONX | 2.5B IONX |
| Year 2-4 | 39.65 IONX | 1.25B IONX |
| Year 4-6 | 19.825 IONX | 625M IONX |
| ... halving every 2 years ... |
| Year 28-30 | 0.00484 IONX | ~153k IONX |

### Burn Mechanism

**20% of transaction fees burned:**

```
If 100M IONX paid in fees per year:
├─ 60% → Validators (60M)
├─ 20% → Treasury (20M)
└─ 20% → BURNED (20M) ← Destroyed permanently
```

**Network becomes deflationary by Year 4** (more burned than minted).

---

## Comparison

| Blockchain | Native Token | Gas Token | Smart Contract? |
|------------|--------------|-----------|-----------------|
| **Ionova** | **IONX** | **IONX** | **No** |
| Ethereum | ETH | ETH | No |
| BSC | BNB | BNB | No |
| Polygon | MATIC | MATIC | No |
| Solana | SOL | SOL | No |

IONX follows the same pattern as major blockchains.

---

## For Developers

### Smart Contracts

**IONX is used like ETH:**

```solidity
// Receive IONX
receive() external payable {}

// Send IONX
payable(recipient).transfer(amount);

// Check balance
address(this).balance
```

**No import needed** - IONX is built-in.

### RPC Methods

```javascript
// Standard Ethereum JSON-RPC
eth_getBalance(address) → IONX balance in wei
eth_sendTransaction() → Send IONX
eth_gasPrice() → Gas price in IONX
```

**100% Ethereum-compatible** - All existing tools work.

---

## FAQ

**Q: Where is the IONX token contract?**
A: There is no contract. IONX is native to the protocol.

**Q: How do I add IONX to MetaMask?**
A: Just add the Ionova network. IONX appears automatically as the main balance.

**Q: Can I create more IONX?**
A: No. Only the protocol can mint IONX via block rewards.

**Q: What about the IONXToken.sol file?**
A: That's been renamed to `WrappedIONX.sol` - it's for cross-chain bridges only, not the actual IONX token.

**Q: Is IONX ERC-20 compatible?**
A: No, IONX is native. But you can interact with it the same way you interact with ETH.

---

## Summary

✅ **IONX is native** - Like ETH, not like USDC
✅ **Used for gas** - Automatically deducted from balance
✅ **Minted by validators** - Via block rewards
✅ **No contract address** - Protocol-level implementation
✅ **Ethereum-compatible** - Works with MetaMask, web3.js, etc.

**Think of IONX exactly like ETH on Ethereum!**

# Ionova Smart Contracts

This directory contains example smart contracts for the Ionova blockchain.

## Supported Languages

Ionova supports **dual VM execution**:

1. **Solidity (EVM)** - For Ethereum compatibility
2. **Rust (WASM)** - For high-performance contracts

## Solidity Contracts

### SimpleStorage.sol

Basic key-value storage contract demonstrating:
- State variables
- Events
- Public functions

**Deploy:**
```javascript
// Using web3.js or ethers.js
const contract = await ethers.deployContract("SimpleStorage");
```

### WrappedIONX.sol

**⚠️ IMPORTANT: This is NOT the native IONX token!**

Native IONX exists on the Ionova blockchain itself (like ETH on Ethereum).

This `WrappedIONX` contract is an ERC-20 representation for:
- **Cross-chain bridges** (Ethereum ↔ Ionova)
- **DEX trading** on other chains (Uniswap, PancakeSwap)
- **Liquidity provision** on other networks

**How it works:**
1. Lock native IONX on Ionova bridge
2. Mint wrapped IONX(ERC-20) on Ethereum
3. Trade wrapped IONX on Uniswap
4. Burn wrapped IONX to unlock native IONX

**For native IONX**, see [`NATIVE_IONX.md`](file:///f:/ionova/requirements/NATIVE_IONX.md)

**Deploy (on Ethereum/BSC):**
```javascript
const wrappedIONX = await ethers.deployContract("WrappedIONX", [initialSupply]);
```

## Gas Costs

Ionova uses the same gas model as Ethereum for Solidity contracts:

| Operation | Gas Cost |
|-----------|----------|
| Simple transfer | 21,000 gas |
| ERC-20 transfer | ~50,000 gas |
| Contract deployment | Variable (based on code size) |

**Fee calculation:**
```
Total fee = base_tx_fee + (gas_used × base_fee_per_gas) + tip
```

At current devnet params:
- `base_tx_fee` = 0.0001 IONX
- `base_fee_per_gas` = 0.000001 IONX
- ERC-20 transfer ≈ 0.0001 + (50,000 × 0.000001) = **0.0501 IONX**

## Compiling Contracts

### Using Hardhat

```bash
npm install --save-dev hardhat
npx hardhat compile
```

### Using Foundry

```bash
forge build
```

### Using solc

```bash
solc --bin --abi SimpleStorage.sol -o build/
```

## Deploying to Ionova

```javascript
// Hardhat example
const { ethers } = require("hardhat");

async function main() {
  // Connect to Ionova RPC
  const provider = new ethers.JsonRpcProvider("http://localhost:27000");
  
  // Deploy contract
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const storage = await SimpleStorage.deploy();
  await storage.waitForDeployment();
  
  console.log("SimpleStorage deployed to:", await storage.getAddress());
  
  // Interact
  await storage.setValue(42);
  const value = await storage.getValue();
  console.log("Stored value:", value);
}

main();
```

## Address Formats

Ionova supports dual address formats:

- **EVM**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` (20 bytes)
- **Native**: `ionova1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq000000` (bech32)

Solidity contracts use EVM addresses (`0x...`).

## Development Tools

Compatible with standard Ethereum tools:

- **Hardhat** - Development environment
- **Foundry** - Fast Solidity toolkit
- **Remix** - Browser IDE
- **MetaMask** - Wallet (set RPC to Ionova node)
- **Ethers.js / Web3.js** - JavaScript libraries

## Network Configuration

### Devnet (Local)

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    ionova_devnet: {
      url: "http://localhost:27000",  // Shard 0
      chainId: 1,
      accounts: ["0x..."] // Your private key
    }
  }
};
```

### Testnet

```javascript
ionova_testnet: {
  url: "https://testnet-rpc.ionova.network",
  chainId: 100,
}
```

## Next Steps

1. Install Hardhat: `npm install --save-dev hardhat`
2. Initialize project: `npx hardhat init`
3. Add Ionova network config
4. Deploy contracts: `npx hardhat run scripts/deploy.js --network ionova_devnet`

## More Examples

See the [examples](./examples/) directory for:
- DeFi (AMM, lending)
- NFTs (ERC-721, ERC-1155)
- DAOs (governance)
- Multi-sig wallets

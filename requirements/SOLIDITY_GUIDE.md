# Solidity Developer Guide for Ionova

## Quick Start

Ionova is **100% Ethereum-compatible** via EVM support. You can deploy any Solidity contract using your existing tools.

### 1. Set Up Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers
npx hardhat init
```

### 2. Configure Ionova Network

Edit `hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.24",
  networks: {
    ionova_devnet: {
      url: "http://localhost:27000",  // Shard 0 sequencer
      chainId: 1,
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
    },
    ionova_testnet: {
      url: "https://testnet-rpc.ionova.network",
      chainId: 100,
    }
  }
};
```

### 3. Deploy a Contract

```bash
npx hardhat run scripts/deploy.js --network ionova_devnet
```

---

## Address Formats

Ionova supports **two address types**:

| Type | Format | Use Case | Example |
|------|--------|----------|---------|
| **EVM** | `0x...` (20 bytes) | Solidity contracts | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` |
| **Native** | `ionova1...` (bech32) | Native transfers | `ionova1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq000000` |

Solidity contracts **always use EVM addresses** (`0x...`).

---

## Gas & Fees

### Gas Pricing

Ionova uses the same gas units as Ethereum:

| Operation | Gas Cost |
|-----------|----------|
| Simple transfer | 21,000 |
| SSTORE (storage write) | 20,000 |
| Contract creation | 32,000 + code |
| ERC-20 transfer | ~50,000 |

### Fee Calculation

```
total_fee = base_tx_fee + (gas_used × base_fee_per_gas) + tip
```

**Current devnet params:**
- `base_tx_fee` = 0.0001 IONX
- `base_fee_per_gas` = 0.000001 IONX

**Example (ERC-20 transfer):**
```
Fee = 0.0001 + (50,000 × 0.000001) + 0
    = 0.0001 + 0.05
    = 0.0501 IONX (~$0.05 if IONX = $1)
```

---

## Example Contracts

### Simple Storage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    function setValue(uint256 _value) public {
        value = _value;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}
```

**Deploy:**
```javascript
const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
const storage = await SimpleStorage.deploy();
await storage.setValue(42);
```

### ERC-20 Token

See [`contracts/IONXToken.sol`](file:///f:/ionova/contracts/IONXToken.sol) for a full implementation.

**Deploy 1M tokens:**
```javascript
const Token = await ethers.getContractFactory("IONXToken");
const token = await Token.deploy(1000000); // 1M initial supply
await token.transfer(recipient, ethers.parseEther("100"));
```

---

## Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying to Ionova...");

  // Deploy SimpleStorage
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const storage = await SimpleStorage.deploy();
  await storage.waitForDeployment();

  const address = await storage.getAddress();
  console.log("SimpleStorage deployed to:", address);

  // Interact
  const tx = await storage.setValue(42);
  await tx.wait();
  console.log("Value set to 42");

  const value = await storage.getValue();
  console.log("Retrieved value:", value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Run:**
```bash
npx hardhat run scripts/deploy.js --network ionova_devnet
```

---

## Interacting with Contracts

### Via Hardhat Console

```bash
npx hardhat console --network ionova_devnet
```

```javascript
> const Storage = await ethers.getContractFactory("SimpleStorage");
> const storage = await Storage.attach("0x..."); // deployed address
> await storage.setValue(123);
> const value = await storage.getValue();
> console.log(value.toString()); // 123
```

### Via ethers.js

```javascript
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("http://localhost:27000");
const signer = new ethers.Wallet("0x...", provider);

const storage = new ethers.Contract(
  "0x...", // contract address
  ["function getValue() view returns (uint256)"],
  signer
);

const value = await storage.getValue();
console.log(value);
```

---

## MetaMask Integration

1. **Add Ionova Network:**
   - Network Name: `Ionova Devnet`
   - RPC URL: `http://localhost:27000`
   - Chain ID: `1`
   - Currency Symbol: `IONX`

2. **Import Account:**
   - Use the private key from your devnet configuration

3. **Interact:**
   - Deploy contracts via Remix
   - Send transactions via MetaMask

---

## Differences from Ethereum

### ✅ Compatible

- All Solidity versions
- Standard opcodes
- Gas model
- ERC standards (ERC-20, ERC-721, ERC-1155)
- Events and logs
- `msg.sender`, `block.timestamp`, etc.

### ⚠️ Different

1. **Sharding**: Contracts are assigned to specific shards
   - Cross-shard calls require async messaging (coming soon)
   - Most dApps work fine on a single shard

2. **Block time**: 1 second (vs Ethereum's ~12s)
   - Faster finality
   - Adjust timelock contracts accordingly

3. **Base fee**: Additional `base_tx_fee` component
   - Anti-spam measure
   - Usually negligible (~0.0001 IONX)

---

## Best Practices

### 1. Gas Optimization

```solidity
// ❌ Bad: Multiple storage writes
function badUpdate(uint256[] memory values) public {
    for (uint i = 0; i < values.length; i++) {
        data[i] = values[i]; // SSTORE each iteration
    }
}

// ✅ Good: Batch operations
function goodUpdate(uint256[] memory values) public {
    uint len = values.length;
    for (uint i = 0; i < len; i++) {
        data[i] = values[i];
    }
}
```

### 2. Use Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);

function transfer(address to, uint256 amount) public {
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transfer(msg.sender, to, amount); // ✅ Emit events
}
```

### 3. Check Shard Assignment

For now, all contract state lives on one shard. Plan your architecture accordingly:

```
✅ Good: Single-shard dApp (DEX, NFT marketplace)
⚠️ Future: Cross-shard calls (coming in Phase 2)
```

---

## Testing

### Unit Tests (Hardhat)

```javascript
const { expect } = require("chai");

describe("SimpleStorage", function () {
  it("Should store and retrieve value", async function () {
    const Storage = await ethers.getContractFactory("SimpleStorage");
    const storage = await Storage.deploy();

    await storage.setValue(42);
    expect(await storage.getValue()).to.equal(42);
  });
});
```

**Run:**
```bash
npx hardhat test
```

---

## Debugging

### View Transaction Receipt

```javascript
const tx = await storage.setValue(42);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
console.log("Status:", receipt.status); // 1 = success
```

### Check Contract Bytecode

```bash
npx hardhat verify --network ionova_devnet 0x... [constructor args]
```

---

## RPC Endpoints

### Devnet (Local)

- **Shard 0**: http://localhost:27000
- **Shard 1**: http://localhost:27100
- **Shard 2**: http://localhost:27200
... (up to Shard 7)

### Load Balancing

For production, use a load balancer:

```javascript
const provider = new ethers.JsonRpcProvider("https://rpc.ionova.network");
```

---

## Next Steps

1. ✅ Deploy example contracts
2. ✅ Test transaction fees
3. 🔜 Cross-shard messaging
4. 🔜 Bridge to Ethereum mainnet
5. 🔜 Subgraph support (The Graph)

## Support

- **Docs**: https://docs.ionova.network
- **Discord**: https://discord.gg/ionova
- **GitHub**: https://github.com/ionova-network

---

**Happy Building on Ionova! 🚀**

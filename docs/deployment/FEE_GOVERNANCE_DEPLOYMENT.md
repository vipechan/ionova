# Fee Governance System - Deployment Guide

## Overview

Complete deployment guide for oracle-based dynamic fee governance system.

## Contracts to Deploy

### 1. FeeGovernance (DAO Contract)
```bash
# Deploy first - needed by other contracts
forge create contracts/governance/FeeGovernance.sol:FeeGovernance \
  --constructor-args <IONX_TOKEN_ADDRESS> \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

### 2. ChainlinkPriceOracle (Primary Oracle)
```bash
# Deploy Chainlink price feed oracle
forge create contracts/oracles/ChainlinkPriceOracle.sol:ChainlinkPriceOracle \
  --constructor-args \
    <CHAINLINK_FEED_ADDRESS> \
    <GOVERNANCE_ADDRESS> \
    100000000000000000 \  # Initial fallback: $0.10
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

### 3. MultiOracleAggregator (Redundancy)
```bash
# Deploy multi-oracle aggregator
forge create contracts/oracles/MultiOracleAggregator.sol:MultiOracleAggregator \
  --constructor-args \
    <ORACLE1_ADDRESS> \
    <ORACLE2_ADDRESS> \
    <ORACLE3_ADDRESS> \
    <GOVERNANCE_ADDRESS> \
  --private-key $PRIVATE_KEY \
  -- url $RPC_URL
```

### 4. DynamicFeeManager
```bash
# Deploy dynamic fee manager
forge create contracts/core/DynamicFeeManager.sol:DynamicFeeManager \
  --constructor-args \
    <MULTI_ORACLE_ADDRESS> \
    <GOVERNANCE_ADDRESS> \
    50000000000000000 \  # Initial base fee: 0.05 IONX
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

## Configuration

### Set Initial Parameters

```javascript
// Using ethers.js
const feeManager = await ethers.getContractAt("DynamicFeeManager", FEE_MANAGER_ADDRESS);

// Set fee bounds
await feeManager.updateFeeBounds(
  ethers.utils.parseEther("0.001"),  // Min: 0.001 IONX
  ethers.utils.parseEther("10")      // Max: 10 IONX
);

// Set target USD fee
await feeManager.updateTargetFee(50); // $0.50

// Enable oracle (first update)
await feeManager.updateBaseFee();
```

## Integration with Node

### Modify Block Production

```rust
// File: node/src/consensus/block_producer.rs

use ethers::prelude::*;

// Add fee manager interface
abigen!(
    DynamicFeeManager,
    "./contracts/out/DynamicFeeManager.sol/DynamicFeeManager.json"
);

impl BlockProducer {
    async fn get_current_base_fee(&self) -> U256 {
        let fee_manager = DynamicFeeManager::new(
            self.config.fee_manager_address,
            self.provider.clone()
        );
        
        fee_manager.base_fee_per_gas().call().await.unwrap()
    }
    
    async fn calculate_transaction_fee(&self, gas_used: U256, tip: U256) -> (U256, U256, U256) {
        let fee_manager = DynamicFeeManager::new(
            self.config.fee_manager_address,
            self.provider.clone()
        );
        
        fee_manager
            .calculate_fee(gas_used, tip)
            .call()
            .await
            .unwrap()
    }
}
```

## Automated Keeper Setup

### Chainlink Keeper (Recommended)

```solidity
// contracts/keepers/FeeUpdateKeeper.sol
contract FeeUpdateKeeper is AutomationCompatibleInterface {
    DynamicFeeManager public feeManager;
    
    function checkUpkeep(bytes calldata) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory) 
    {
        upkeepNeeded = block.timestamp >= feeManager.lastUpdateTime() + 1 hours;
    }
    
    function performUpkeep(bytes calldata) external override {
        feeManager.updateBaseFee();
    }
}
```

### Manual Cron Job

```bash
#!/bin/bash
# scripts/update-fees.sh

# Update base fee every hour
while true; do
  cast send $FEE_MANAGER_ADDRESS \
    "updateBaseFee()" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
  
  sleep 3600  # 1 hour
done
```

## Testing

### Local Testing

```bash
# Start local node
anvil

# Deploy contracts
./scripts/deploy-fee-governance.sh

# Run tests
forge test --match-contract FeeGovernance -vvv
```

### Test Scenarios

```solidity
// test/DynamicFeeManager.t.sol
contract DynamicFeeManagerTest is Test {
    function testFeeAtDifferentPrices() public {
        // Test at $0.10
        oracle.setPrice(1e17);
        feeManager.updateBaseFee();
        assertEq(feeManager.baseFeePerGas(), 5e17); // 0.5 IONX for $0.50 target
        
        // Test at $1
        oracle.setPrice(1e18);
        feeManager.updateBaseFee();
        assertEq(feeManager.baseFeePerGas(), 5e16); // 0.05 IONX
        
        // Test at $1000
        oracle.setPrice(1e21);
        feeManager.updateBaseFee();
        assertEq(feeManager.baseFeePerGas(), 5e14); // 0.0005 IONX
    }
}
```

## Governance Usage

### Create Proposal to Adjust Fees

```javascript
const governance = await ethers.getContractAt("FeeGovernance", GOVERNANCE_ADDRESS);

// Encode function call
const callData = feeManager.interface.encodeFunctionData("updateTargetFee", [25]); // $0.25

// Create proposal
const tx = await governance.propose(
  "Lower target fee to $0.25",
  FEE_MANAGER_ADDRESS,
  callData
);

const receipt = await tx.wait();
const proposalId = receipt.events[0].args.proposalId;

console.log(`Proposal ${proposalId} created`);
```

### Vote on Proposal

```javascript
// Vote yes
await governance.castVote(proposalId, true);

// Check status
const state = await governance.getProposalState(proposalId);
console.log(`For: ${state.forVotes}, Against: ${state.againstVotes}`);
```

### Execute Proposal

```javascript
// Wait for voting period + timelock
await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 24 * 60 * 60]);
await ethers.provider.send("evm_mine");

// Execute
await governance.execute(proposalId);
```

## Monitoring

### Fee Dashboard

```javascript
// scripts/monitor-fees.js
async function monitorFees() {
  const feeManager = await ethers.getContractAt("DynamicFeeManager", FEE_MANAGER_ADDRESS);
  const oracle = await ethers.getContractAt("IPriceOracle", ORACLE_ADDRESS);
  
  setInterval(async () => {
    const [price, updatedAt] = await oracle.getIONXPrice();
    const baseFee = await feeManager.baseFeePerGas();
    const targetCents = await feeManager.targetFeeUSDCents();
    
    console.log({
      ionxPrice: ethers.utils.formatEther(price),
      baseFee: ethers.utils.formatEther(baseFee),
      targetUSD: targetCents / 100,
      lastUpdate: new Date(updatedAt * 1000)
    });
  }, 60000); // Every minute
}
```

## Emergency Procedures

### Activate Emergency Mode

```javascript
// Requires 80% approval
await governance.activateEmergencyMode();

// Set manual fee
await feeManager.emergencySetFee(ethers.utils.parseEther("0.05"));
```

### Deactivate After Recovery

```javascript
await governance.deactivateEmergencyMode();
```

## Deployment Checklist

- [ ] Deploy FeeGovernance contract
- [ ] Deploy ChainlinkPriceOracle (or 3 oracles)
- [ ] Deploy MultiOracleAggregator
- [ ] Deploy DynamicFeeManager
- [ ] Configure initial parameters
- [ ] Setup automated keeper
- [ ] Test with various prices
- [ ] Monitor for 24 hours
- [ ] Document oracle addresses
- [ ] Community announcement

## Network Addresses

### Testnet
```
FeeGovernance:       0x...
ChainlinkOracle:     0x...
MultiOracle:         0x...
DynamicFeeManager:   0x...
Keeper:              0x...
```

### Mainnet
```
Pending deployment...
```

## Support

- Documentation: `docs/FEE_GOVERNANCE.md`
- Contracts: `contracts/core/` and `contracts/oracles/`
- Issues: https://github.com/vipechan/ionova/issues

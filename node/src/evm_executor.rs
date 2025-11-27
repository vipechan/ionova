use alloy_primitives::{Address, U256, Bytes};
use anyhow::{Result, anyhow};
use revm::{
    primitives::{
        ExecutionResult, Output, TransactTo, TxEnv, Env, BlockEnv, CfgEnv,
    },
    Database, Evm, InMemoryDB,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

/// EVM transaction for Solidity contracts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmTransaction {
    pub from: Address,
    pub to: Option<Address>, // None for contract creation
    pub value: U256,
    pub data: Bytes,
    pub gas_limit: u64,
    pub gas_price: U256,
    pub nonce: u64,
}

/// EVM execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmExecutionResult {
    pub success: bool,
    pub gas_used: u64,
    pub output: Vec<u8>,
    pub contract_address: Option<Address>,
    pub logs: Vec<String>,
}

/// EVM executor for Solidity smart contracts
pub struct EvmExecutor {
    db: InMemoryDB,
    chain_id: u64,
}

impl EvmExecutor {
    pub fn new(chain_id: u64) -> Self {
        Self {
            db: InMemoryDB::default(),
            chain_id,
        }
    }

    /// Execute an EVM transaction
    pub fn execute(&mut self, tx: EvmTransaction) -> Result<EvmExecutionResult> {
        // Set up environment
        let mut env = Env::default();
        
        // Configure chain
        env.cfg = CfgEnv {
            chain_id: self.chain_id,
            ..Default::default()
        };

        // Configure block
        env.block = BlockEnv {
            number: U256::from(1),
            ..Default::default()
        };

        // Configure transaction
        env.tx = TxEnv {
            caller: tx.from,
            gas_limit: tx.gas_limit,
            gas_price: tx.gas_price,
            transact_to: match tx.to {
                Some(addr) => TransactTo::Call(addr),
                None => TransactTo::Create,
            },
            value: tx.value,
            data: tx.data.clone(),
            nonce: Some(tx.nonce),
            ..Default::default()
        };

        // Create and execute EVM
        let mut evm = Evm::builder()
            .with_env(Box::new(env))
            .with_db(&mut self.db)
            .build();

        let result = evm.transact().map_err(|e| anyhow!("EVM execution failed: {:?}", e))?;

        // Extract results
        let execution_result = result.result;
        
        let (success, gas_used, output, contract_address) = match execution_result {
            ExecutionResult::Success { gas_used, output, .. } => {
                match output {
                    Output::Call(bytes) => (true, gas_used, bytes.to_vec(), None),
                    Output::Create(bytes, addr) => (true, gas_used, bytes.to_vec(), addr),
                }
            }
            ExecutionResult::Revert { gas_used, output } => {
                (false, gas_used, output.to_vec(), None)
            }
            ExecutionResult::Halt { gas_used, .. } => {
                (false, gas_used, vec![], None)
            }
        };

        Ok(EvmExecutionResult {
            success,
            gas_used,
            output,
            contract_address,
            logs: vec![], // Simplified - would extract from result
        })
    }

    /// Set account balance (for testing)
    pub fn set_balance(&mut self, address: Address, balance: U256) {
        let account = self.db.accounts.entry(address).or_default();
        account.info.balance = balance;
    }

    /// Get account balance
    pub fn get_balance(&self, address: Address) -> U256 {
        self.db
            .accounts
            .get(&address)
            .map(|acc| acc.info.balance)
            .unwrap_or(U256::ZERO)
    }

    /// Set contract code
    pub fn set_code(&mut self, address: Address, code: Bytes) {
        let account = self.db.accounts.entry(address).or_default();
        account.info.code = Some(revm::primitives::Bytecode::new_raw(code));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_transfer() {
        let mut executor = EvmExecutor::new(1);

        let from = Address::from([1u8; 20]);
        let to = Address::from([2u8; 20]);

        // Set initial balance
        executor.set_balance(from, U256::from(1000));

        // Create transfer tx
        let tx = EvmTransaction {
            from,
            to: Some(to),
            value: U256::from(100),
            data: Bytes::new(),
            gas_limit: 21000,
            gas_price: U256::from(1),
            nonce: 0,
        };

        let result = executor.execute(tx).unwrap();

        assert!(result.success);
        assert!(result.gas_used <= 21000);
    }

    #[test]
    fn test_contract_creation() {
        let mut executor = EvmExecutor::new(1);

        let from = Address::from([1u8; 20]);
        executor.set_balance(from, U256::from(1_000_000));

        // Simple contract bytecode (returns 42)
        // PUSH1 0x2A PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
        let bytecode = hex::decode("602a60005260206000f3").unwrap();

        let tx = EvmTransaction {
            from,
            to: None, // Contract creation
            value: U256::ZERO,
            data: Bytes::from(bytecode),
            gas_limit: 100000,
            gas_price: U256::from(1),
            nonce: 0,
        };

        let result = executor.execute(tx).unwrap();

        assert!(result.success);
        assert!(result.contract_address.is_some());
    }
}

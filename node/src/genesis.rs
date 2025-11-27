use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// IONX decimals (18, same as ETH)
pub const IONX_DECIMALS: u128 = 1_000_000_000_000_000_000; // 10^18

/// Account structure holding native IONX
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub balance: u128,  // Native IONX balance in wei (10^-18)
    pub nonce: u64,
}

impl Account {
    pub fn new(balance_ionx: u128) -> Self {
        Self {
            balance: balance_ionx * IONX_DECIMALS,
            nonce: 0,
        }
    }
}

/// Genesis state with pre-allocated accounts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisState {
    pub accounts: HashMap<String, Account>,
    pub total_supply: u128,
}

impl GenesisState {
    /// Create Ionova genesis state
    pub fn create() -> Self {
        let mut accounts = HashMap::new();
        let mut total = 0u128;

        // 1. Validator allocations (2,000,000 IONX / 21 validators)
        let validator_allocation = 95_238; // IONX per validator
        
        for i in 0..21 {
            let address = format!("ionova1validator{}qqqqqqqqqqqqqqqqqqqqqqqqqq", i);
            accounts.insert(
                address,
                Account::new(validator_allocation)
            );
            total += validator_allocation * IONX_DECIMALS;
        }

        // 2. Airdrop fund (10,000,000 IONX for 100k users)
        let airdrop_address = "ionova1airdropqqqqqqqqqqqqqqqqqqqqqqqqqqqqq".to_string();
        accounts.insert(
            airdrop_address,
            Account::new(10_000_000)
        );
        total += 10_000_000 * IONX_DECIMALS;

        // 3. Reserved fund (100,000 IONX)
        let reserved_address = "ionova1reservedqqqqqqqqqqqqqqqqqqqqqqqqqqqqq".to_string();
        accounts.insert(
            reserved_address,
            Account::new(100_000)
        );
        total += 100_000 * IONX_DECIMALS;

        GenesisState {
            accounts,
            total_supply: total,
        }
    }

    /// Get total genesis supply in IONX
    pub fn get_total_ionx(&self) -> u128 {
        self.total_supply / IONX_DECIMALS
    }
}

/// Mint native IONX to an account (used for block rewards)
pub fn mint_to(accounts: &mut HashMap<String, Account>, address: &str, amount: u128) {
    if let Some(account) = accounts.get_mut(address) {
        account.balance += amount;
    } else {
        accounts.insert(
            address.to_string(),
            Account {
                balance: amount,
                nonce: 0,
            }
        );
    }
}

/// Burn native IONX from an account (used for fee burning)
pub fn burn_from(accounts: &mut HashMap<String, Account>, address: &str, amount: u128) -> Result<(), String> {
    if let Some(account) = accounts.get_mut(address) {
        if account.balance >= amount {
            account.balance -= amount;
            Ok(())
        } else {
            Err("Insufficient balance".to_string())
        }
    } else {
        Err("Account not found".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genesis_creation() {
        let genesis = GenesisState::create();
        
        // Total should be: 2M + 10M + 100k = 12.1M IONX
        assert_eq!(genesis.get_total_ionx(), 12_100_000);
        
        // Should have 21 validators + 1 airdrop + 1 reserved = 23 accounts
        assert_eq!(genesis.accounts.len(), 23);
    }

    #[test]
    fn test_validator_balances() {
        let genesis = GenesisState::create();
        
        // Check first validator
        let val0 = genesis.accounts.get("ionova1validator0qqqqqqqqqqqqqqqqqqqqqqqqqq").unwrap();
        assert_eq!(val0.balance, 95_238 * IONX_DECIMALS);
    }

    #[test]
    fn test_mint() {
        let mut accounts = HashMap::new();
        let address = "ionova1test".to_string();
        
        // Mint 100 IONX
        mint_to(&mut accounts, &address, 100 * IONX_DECIMALS);
        
        assert_eq!(accounts.get(&address).unwrap().balance, 100 * IONX_DECIMALS);
        
        // Mint another 50 IONX
        mint_to(&mut accounts, &address, 50 * IONX_DECIMALS);
        
        assert_eq!(accounts.get(&address).unwrap().balance, 150 * IONX_DECIMALS);
    }

    #[test]
    fn test_burn() {
        let mut accounts = HashMap::new();
        let address = "ionova1test".to_string();
        
        accounts.insert(address.clone(), Account::new(100));
        
        // Burn 30 IONX
        burn_from(&mut accounts, &address, 30 * IONX_DECIMALS).unwrap();
        
        assert_eq!(accounts.get(&address).unwrap().balance, 70 * IONX_DECIMALS);
    }
}

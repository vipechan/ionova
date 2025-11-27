use anyhow::Result;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use thiserror::Error;

use crate::fee_model::{FeeConfig, TransactionFee};
use crate::sequencer::Transaction;

#[derive(Error, Debug)]
pub enum MempoolError {
    #[error("Transaction fee {0} is below minimum {1}")]
    FeeTooLow(Decimal, Decimal),
    
    #[error("Account {0} has exceeded rate limit")]
    RateLimitExceeded(String),
    
    #[error("Mempool is full")]
    MempoolFull,
}

/// Mempool configuration
#[derive(Debug, Clone)]
pub struct MempoolConfig {
    /// Minimum fee to enter mempool
    pub min_fee: Decimal,
    
    /// Maximum transactions per account per interval
    pub per_account_limit: usize,
    
    /// Rate limit interval
    pub rate_limit_interval: Duration,
    
    /// Maximum mempool size
    pub max_size: usize,
}

impl Default for MempoolConfig {
    fn default() -> Self {
        Self {
            min_fee: Decimal::new(51, 4), // 0.0051 IONX
            per_account_limit: 100,
            rate_limit_interval: Duration::from_secs(1),
            max_size: 10000,
        }
    }
}

/// Per-account rate limiting tracker
#[derive(Debug, Clone)]
struct AccountRateLimit {
    count: usize,
    last_reset: Instant,
}

/// Transaction mempool with rate limiting and minimum fee enforcement
pub struct Mempool {
    config: MempoolConfig,
    fee_config: FeeConfig,
    pending: HashMap<String, Transaction>,
    rate_limits: HashMap<String, AccountRateLimit>,
}

impl Mempool {
    pub fn new(config: MempoolConfig, fee_config: FeeConfig) -> Self {
        Self {
            config,
            fee_config,
            pending: HashMap::new(),
            rate_limits: HashMap::new(),
        }
    }

    /// Add transaction to mempool with validation
    pub fn add_tx(&mut self, tx: Transaction) -> Result<(), MempoolError> {
        // Check mempool capacity
        if self.pending.len() >= self.config.max_size {
            return Err(MempoolError::MempoolFull);
        }

        // Calculate and validate fee
        let total_fee = TransactionFee::calculate(
            &self.fee_config,
            tx.gas_used,
            tx.tip,
        ).total;

        if total_fee < self.config.min_fee {
            return Err(MempoolError::FeeTooLow(total_fee, self.config.min_fee));
        }

        // Check rate limit
        self.check_rate_limit(&tx.from)?;

        // Add to pending
        let tx_hash = tx.hash();
        self.pending.insert(tx_hash, tx);

        Ok(())
    }

    /// Check and enforce per-account rate limit
    fn check_rate_limit(&mut self, account: &str) -> Result<(), MempoolError> {
        let now = Instant::now();

        let rate_limit = self.rate_limits
            .entry(account.to_string())
            .or_insert_with(|| AccountRateLimit {
                count: 0,
                last_reset: now,
            });

        // Reset counter if interval has passed
        if now.duration_since(rate_limit.last_reset) >= self.config.rate_limit_interval {
            rate_limit.count = 0;
            rate_limit.last_reset = now;
        }

        // Check limit
        if rate_limit.count >= self.config.per_account_limit {
            return Err(MempoolError::RateLimitExceeded(account.to_string()));
        }

        rate_limit.count += 1;
        Ok(())
    }

    /// Get transactions for sequencer batch (up to limit)
    pub fn get_batch(&mut self, limit: usize) -> Vec<Transaction> {
        let txs: Vec<Transaction> = self.pending
            .values()
            .take(limit)
            .cloned()
            .collect();

        // Remove from pending
        for tx in &txs {
            self.pending.remove(&tx.hash());
        }

        txs
    }

    /// Get current mempool size
    pub fn size(&self) -> usize {
        self.pending.len()
    }

    /// Remove transaction by hash
    pub fn remove(&mut self, hash: &str) -> Option<Transaction> {
        self.pending.remove(hash)
    }

    /// Clear all pending transactions
    pub fn clear(&mut self) {
        self.pending.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    fn create_test_tx(from: &str, gas_used: u64, tip: Decimal) -> Transaction {
        Transaction {
            from: from.to_string(),
            to: "addr_to".to_string(),
            amount: dec!(1.0),
            gas_limit: 50000,
            gas_used,
            tip,
            nonce: 1,
            shard_id: 0,
            timestamp: 0,
            signature: "sig".to_string(),
        }
    }

    #[test]
    fn test_add_valid_tx() {
        let mut mempool = Mempool::new(
            MempoolConfig::default(),
            FeeConfig::default(),
        );

        let tx = create_test_tx("addr1", 5000, dec!(0.0));
        assert!(mempool.add_tx(tx).is_ok());
        assert_eq!(mempool.size(), 1);
    }

    #[test]
    fn test_fee_too_low() {
        let mut mempool = Mempool::new(
            MempoolConfig::default(),
            FeeConfig::default(),
        );

        // Very low gas tx won't meet minimum fee
        let tx = create_test_tx("addr1", 100, dec!(0.0));
        assert!(matches!(
            mempool.add_tx(tx),
            Err(MempoolError::FeeTooLow(_, _))
        ));
    }

    #[test]
    fn test_rate_limit() {
        let mut config = MempoolConfig::default();
        config.per_account_limit = 2;

        let mut mempool = Mempool::new(config, FeeConfig::default());

        // First two txs should succeed
        assert!(mempool.add_tx(create_test_tx("addr1", 5000, dec!(0.0))).is_ok());
        assert!(mempool.add_tx(create_test_tx("addr1", 5000, dec!(0.0))).is_ok());

        // Third should fail
        assert!(matches!(
            mempool.add_tx(create_test_tx("addr1", 5000, dec!(0.0))),
            Err(MempoolError::RateLimitExceeded(_))
        ));

        // Different account should succeed
        assert!(mempool.add_tx(create_test_tx("addr2", 5000, dec!(0.0))).is_ok());
    }

    #[test]
    fn test_get_batch() {
        let mut mempool = Mempool::new(
            MempoolConfig::default(),
            FeeConfig::default(),
        );

        // Add 5 transactions
        for i in 0..5 {
            let tx = create_test_tx(&format!("addr{}", i), 5000, dec!(0.0));
            mempool.add_tx(tx).unwrap();
        }

        assert_eq!(mempool.size(), 5);

        // Get batch of 3
        let batch = mempool.get_batch(3);
        assert_eq!(batch.len(), 3);
        assert_eq!(mempool.size(), 2); // 2 remaining
    }
}

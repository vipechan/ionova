use std::collections::{HashMap, HashSet, VecDeque};
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use anyhow::Result;

use crate::transaction::Transaction;

/// Mempool configuration
#[derive(Debug, Clone)]
pub struct MempoolConfig {
    pub max_size: usize,
    pub max_tx_age_secs: u64,
    pub min_gas_price: u64,
    pub max_tx_per_account: usize,
}

impl Default for MempoolConfig {
    fn default() -> Self {
        Self {
            max_size: 10_000,
            max_tx_age_secs: 3600, // 1 hour
            min_gas_price: 1,
            max_tx_per_account: 100,
        }
    }
}

/// Transaction pool with ordering and validation
pub struct Mempool {
    /// Pending transactions indexed by hash
    transactions: RwLock<HashMap<String, PooledTransaction>>,
    
    /// Transactions by account nonce (for ordering)
    by_account: RwLock<HashMap<String, VecDeque<String>>>,
    
    /// Transaction hashes ordered by priority (gas price)
    priority_queue: RwLock<Vec<String>>,
    
    /// Configuration
    config: MempoolConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PooledTransaction {
    pub tx: Transaction,
    pub tx_hash: String,
    pub received_at: SystemTime,
    pub gas_price: u64,
}

impl Mempool {
    pub fn new(config: MempoolConfig) -> Self {
        Self {
            transactions: RwLock::new(HashMap::new()),
            by_account: RwLock::new(HashMap::new()),
            priority_queue: RwLock::new(Vec::new()),
            config,
        }
    }

    /// Add transaction to mempool with validation
    pub async fn add_transaction(&self, tx: Transaction) -> Result<String> {
        // Validate transaction
        self.validate_transaction(&tx).await?;
        
        let tx_hash = format!("{:?}", tx.hash());
        let from_address = format!("{:?}", tx.from);
        
        let pooled_tx = PooledTransaction {
            tx: tx.clone(),
            tx_hash: tx_hash.clone(),
            received_at: SystemTime::now(),
            gas_price: tx.gas_price.to_string().parse().unwrap_or(0),
        };

        // Add to main pool
        {
            let mut txs = self.transactions.write().await;
            
            // Check mempool size limit
            if txs.len() >= self.config.max_size {
                self.evict_lowest_priority().await?;
            }
            
            txs.insert(tx_hash.clone(), pooled_tx);
        }

        // Add to account queue
        {
            let mut by_account = self.by_account.write().await;
            let account_txs = by_account.entry(from_address.clone()).or_insert_with(VecDeque::new);
            
            // Check per-account limit
            if account_txs.len() >= self.config.max_tx_per_account {
                return Err(anyhow::anyhow!("Too many pending transactions for this account"));
            }
            
            account_txs.push_back(tx_hash.clone());
        }

        // Update priority queue
        self.update_priority_queue().await;

        Ok(tx_hash)
    }

    /// Validate transaction before adding
    async fn validate_transaction(&self, tx: &Transaction) -> Result<()> {
        // 1. Check signature
        if !tx.verify_signature()? {
            return Err(anyhow::anyhow!("Invalid signature"));
        }

        // 2. Check gas price meets minimum
        let gas_price: u64 = tx.gas_price.to_string().parse().unwrap_or(0);
        if gas_price < self.config.min_gas_price {
            return Err(anyhow::anyhow!("Gas price too low"));
        }

        // 3. Check if transaction already exists
        let tx_hash = format!("{:?}", tx.hash());
        let txs = self.transactions.read().await;
        if txs.contains_key(&tx_hash) {
            return Err(anyhow::anyhow!("Transaction already in mempool"));
        }

        // 4. Check expiry
        if let Some(expiry) = tx.expiry {
            let now = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            if now > expiry {
                return Err(anyhow::anyhow!("Transaction expired"));
            }
        }

        Ok(())
    }

    /// Get transactions for block production (highest priority)
    pub async fn get_pending_transactions(&self, max_count: usize) -> Vec<Transaction> {
        let priority = self.priority_queue.read().await;
        let txs = self.transactions.read().await;
        
        priority
            .iter()
            .take(max_count)
            .filter_map(|hash| txs.get(hash))
            .map(|pooled| pooled.tx.clone())
            .collect()
    }

    /// Remove transaction (after inclusion in block)
    pub async fn remove_transaction(&self, tx_hash: &str) -> Result<()> {
        let mut txs = self.transactions.write().await;
        
        if let Some(pooled) = txs.remove(tx_hash) {
            let from = format!("{:?}", pooled.tx.from);
            
            // Remove from account queue
            let mut by_account = self.by_account.write().await;
            if let Some(account_txs) = by_account.get_mut(&from) {
                account_txs.retain(|h| h != tx_hash);
                if account_txs.is_empty() {
                    by_account.remove(&from);
                }
            }
        }

        Ok(())
    }

    /// Clean up expired transactions
    pub async fn cleanup_expired(&self) {
        let now = SystemTime::now();
        let max_age = Duration::from_secs(self.config.max_tx_age_secs);
        
        let mut txs = self.transactions.write().await;
        let mut to_remove = Vec::new();

        for (hash, pooled) in txs.iter() {
            if let Ok(age) = now.duration_since(pooled.received_at) {
                if age > max_age {
                    to_remove.push(hash.clone());
                }
            }
        }

        for hash in to_remove {
            txs.remove(&hash);
        }
    }

    /// Update priority queue based on gas prices
    async fn update_priority_queue(&self) {
        let txs = self.transactions.read().await;
        let mut priority = self.priority_queue.write().await;
        
        priority.clear();
        priority.extend(txs.keys().cloned());
        
        // Sort by gas price (highest first)
        priority.sort_by(|a, b| {
            let gas_a = txs.get(a).map(|t| t.gas_price).unwrap_or(0);
            let gas_b = txs.get(b).map(|t| t.gas_price).unwrap_or(0);
            gas_b.cmp(&gas_a)
        });
    }

    /// Evict lowest priority transaction
    async fn evict_lowest_priority(&self) -> Result<()> {
        let priority = self.priority_queue.read().await;
        if let Some(lowest) = priority.last() {
            self.remove_transaction(lowest).await?;
        }
        Ok(())
    }

    /// Get mempool statistics
    pub async fn stats(&self) -> MempoolStats {
        let txs = self.transactions.read().await;
        let by_account = self.by_account.read().await;
        
        MempoolStats {
            total_transactions: txs.len(),
            unique_accounts: by_account.len(),
            capacity_used_percent: (txs.len() as f64 / self.config.max_size as f64 * 100.0) as u32,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct MempoolStats {
    pub total_transactions: usize,
    pub unique_accounts: usize,
    pub capacity_used_percent: u32,
}

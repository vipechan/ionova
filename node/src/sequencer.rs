use anyhow::Result;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;
use tracing::{info, warn};

use crate::fee_model::{FeeConfig, TransactionFee};
use crate::mempool::{Mempool, MempoolConfig};

/// Transaction data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub from: String,
    pub to: String,
    pub amount: Decimal,
    pub gas_limit: u64,
    pub gas_used: u64,
    pub tip: Decimal,
    pub nonce: u64,
    pub shard_id: u8,
    pub timestamp: u64,
    pub signature: String,
}

impl Transaction {
    pub fn hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(serde_json::to_string(self).unwrap().as_bytes());
        hex::encode(hasher.finalize())
    }
}

/// Micro-block produced by sequencer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicroBlock {
    pub shard_id: u8,
    pub sequence: u64,
    pub timestamp: u64,
    pub transactions: Vec<Transaction>,
    pub state_root: String,
}

/// Batch commitment posted to base layer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchCommitment {
    pub shard_id: u8,
    pub batch_sequence: u64,
    pub micro_blocks: Vec<MicroBlock>,
    pub state_root: String,
    pub transactions_count: usize,
    pub timestamp: u64,
}

/// Sequencer configuration
#[derive(Debug, Clone)]
pub struct SequencerConfig {
    pub shard_id: u8,
    pub micro_block_interval_ms: u64,
    pub batch_interval_ms: u64,
    pub max_batch_size: usize,
    pub fee_config: FeeConfig,
    pub mempool_config: MempoolConfig,
}

/// Sequencer processes transactions and produces batches
pub struct Sequencer {
    config: SequencerConfig,
    tx_queue: mpsc::Receiver<Transaction>,
    mempool: Mempool,
    micro_blocks: Vec<MicroBlock>,
    sequence_counter: u64,
    batch_counter: u64,
}

impl Sequencer {
    pub fn new(config: SequencerConfig, tx_queue: mpsc::Receiver<Transaction>) -> Self {
        let mempool = Mempool::new(
            config.mempool_config.clone(),
            config.fee_config.clone(),
        );

        Self {
            config,
            tx_queue,
            mempool,
            micro_blocks: Vec::new(),
            sequence_counter: 0,
            batch_counter: 0,
        }
    }

    /// Run the sequencer loop
    pub async fn run(&mut self) -> Result<()> {
        info!(
            "Starting sequencer for shard {}",
            self.config.shard_id
        );

        let mut micro_block_interval =
            tokio::time::interval(std::time::Duration::from_millis(
                self.config.micro_block_interval_ms,
            ));

        let mut batch_interval =
            tokio::time::interval(std::time::Duration::from_millis(
                self.config.batch_interval_ms,
            ));

        loop {
            tokio::select! {
                // Collect transactions and add to mempool
                Some(tx) = self.tx_queue.recv() => {
                    match self.mempool.add_tx(tx) {
                        Ok(_) => {},
                        Err(e) => {
                            warn!("Transaction rejected: {}", e);
                        }
                    }
                }

                // Produce micro-block
                _ = micro_block_interval.tick() => {
                    if self.mempool.size() > 0 {
                        let pending_txs = self.mempool.get_batch(self.config.max_batch_size);
                        if !pending_txs.is_empty() {
                            let micro_block = self.produce_micro_block(pending_txs);
                            self.micro_blocks.push(micro_block);
                        }
                    }
                }

                // Produce batch commitment
                _ = batch_interval.tick() => {
                    if !self.micro_blocks.is_empty() {
                        let batch = self.produce_batch();
                        self.submit_batch(batch).await?;
                        self.micro_blocks.clear();
                    }
                }
            }
        }
    }

    fn produce_micro_block(&mut self, transactions: Vec<Transaction>) -> MicroBlock {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Compute state root (simplified - in production use Merkle tree)
        let mut hasher = Sha256::new();
        for tx in &transactions {
            hasher.update(tx.hash().as_bytes());
        }
        let state_root = hex::encode(hasher.finalize());

        let micro_block = MicroBlock {
            shard_id: self.config.shard_id,
            sequence: self.sequence_counter,
            timestamp,
            transactions,
            state_root,
        };

        self.sequence_counter += 1;
        micro_block
    }

    fn produce_batch(&mut self) -> BatchCommitment {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let transactions_count: usize = self
            .micro_blocks
            .iter()
            .map(|mb| mb.transactions.len())
            .sum();

        // Compute batch state root
        let mut hasher = Sha256::new();
        for mb in &self.micro_blocks {
            hasher.update(mb.state_root.as_bytes());
        }
        let state_root = hex::encode(hasher.finalize());

        let batch = BatchCommitment {
            shard_id: self.config.shard_id,
            batch_sequence: self.batch_counter,
            micro_blocks: self.micro_blocks.clone(),
            state_root,
            transactions_count,
            timestamp,
        };

        self.batch_counter += 1;
        batch
    }

    async fn submit_batch(&self, batch: BatchCommitment) -> Result<()> {
        info!(
            "Shard {} submitting batch {} with {} transactions",
            batch.shard_id, batch.batch_sequence, batch.transactions_count
        );

        // In production, this would submit to base layer consensus
        // For now, just log
        Ok(())
    }
}

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use anyhow::Result;

/// Block propagation manager
pub struct BlockPropagation {
    /// Known blocks (hash -> data)
    known_blocks: Arc<RwLock<HashMap<String, BlockData>>>,
    
    /// Propagation status per peer
    peer_blocks: Arc<RwLock<HashMap<String, HashSet<String>>>>,
    
    /// Configuration
    config: PropagationConfig,
}

#[derive(Debug, Clone)]
pub struct PropagationConfig {
    /// Maximum number of peers to propagate to
    pub max_peers: usize,
    
    /// Whether to use compact block relay
    pub compact_blocks: bool,
    
    /// Block validation timeout (ms)
    pub validation_timeout_ms: u64,
}

impl Default for PropagationConfig {
    fn default() -> Self {
        Self {
            max_peers: 8,
            compact_blocks: true,
            validation_timeout_ms: 500,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockData {
    pub hash: String,
    pub height: u64,
    pub parent_hash: String,
    pub transactions: Vec<String>,
    pub validator_signature: Vec<u8>,
    pub timestamp: u64,
}

/// Block propagation rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PropagationRule {
    /// Always propagate to all peers
    Broadcast,
    
    /// Propagate only to subset of peers
    Selective { max_peers: usize },
    
    /// Propagate using compact block format
    Compact,
    
    /// No propagation (validator only)
    None,
}

impl BlockPropagation {
    pub fn new(config: PropagationConfig) -> Self {
        Self {
            known_blocks: Arc::new(RwLock::new(HashMap::new())),
            peer_blocks: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    /// Add new block and determine propagation
    pub async fn add_block(&self, block: BlockData) -> Result<PropagationDecision> {
        let block_hash = block.hash.clone();
        
        // Add to known blocks
        {
            let mut blocks = self.known_blocks.write().await;
            blocks.insert(block_hash.clone(), block.clone());
        }

        // Determine propagation strategy
        let decision = self.decide_propagation(&block).await;
        
        Ok(decision)
    }

    /// Decide how to propagate block
    async fn decide_propagation(&self, block: &BlockData) -> PropagationDecision {
        // Rule 1: If compact blocks enabled, use compact format
        let format = if self.config.compact_blocks {
            BlockFormat::Compact
        } else {
            BlockFormat::Full
        };

        // Rule 2: Select peers who don't have this block
        let peers = self.select_propagation_peers(&block.hash).await;

        PropagationDecision {
            block_hash: block.hash.clone(),
            peers,
            format,
            priority: self.calculate_priority(block),
        }
    }

    /// Select peers for propagation
    async fn select_propagation_peers(&self, block_hash: &str) -> Vec<String> {
        let peer_blocks = self.peer_blocks.read().await;
        
        // Find peers who don't have this block
        let mut candidates: Vec<String> = peer_blocks
            .iter()
            .filter(|(_, blocks)| !blocks.contains(block_hash))
            .map(|(peer_id, _)| peer_id.clone())
            .collect();

        // Limit to max_peers
        candidates.truncate(self.config.max_peers);
        candidates
    }

    /// Calculate block priority for propagation
    fn calculate_priority(&self, block: &BlockData) -> BlockPriority {
        // Higher priority for newer blocks
        BlockPriority::High
    }

    /// Mark block as sent to peer
    pub async fn mark_sent_to_peer(&self, peer_id: &str, block_hash: &str) {
        let mut peer_blocks = self.peer_blocks.write().await;
        peer_blocks
            .entry(peer_id.to_string())
            .or_insert_with(HashSet::new)
            .insert(block_hash.to_string());
    }

    /// Check if peer has block
    pub async fn peer_has_block(&self, peer_id: &str, block_hash: &str) -> bool {
        let peer_blocks = self.peer_blocks.read().await;
        peer_blocks
            .get(peer_id)
            .map(|blocks| blocks.contains(block_hash))
            .unwrap_or(false)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropagationDecision {
    pub block_hash: String,
    pub peers: Vec<String>,
    pub format: BlockFormat,
    pub priority: BlockPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlockFormat {
    /// Full block with all transactions
    Full,
    
    /// Compact block (only tx hashes)
    Compact,
    
    /// Header only
    HeaderOnly,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum BlockPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

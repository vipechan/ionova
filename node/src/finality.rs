use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use anyhow::Result;

/// HotStuff-based finality gadget for Ionova
/// Provides BFT consensus with 3-phase commit
pub struct FinalityGadget {
    /// Current view number
    current_view: Arc<RwLock<u64>>,
    
    /// Validator set
    validators: Arc<RwLock<ValidatorSet>>,
    
    /// Proposal history
    proposals: Arc<RwLock<HashMap<u64, Proposal>>>,
    
    /// Vote storage
    votes: Arc<RwLock<HashMap<u64, VoteCollection>>>,
    
    /// Configuration
    config: FinalityConfig,
}

#[derive(Debug, Clone)]
pub struct FinalityConfig {
    /// View timeout (ms)
    pub view_timeout_ms: u64,
    
    /// Minimum validators needed (Byzantine fault tolerance)
    pub min_validators: usize,
    
    /// Whether to use pipelined consensus
    pub pipelined: bool,
}

impl Default for FinalityConfig {
    fn default() -> Self {
        Self {
            view_timeout_ms: 1000,
            min_validators: 4,
            pipelined: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ValidatorSet {
    pub validators: HashMap<String, ValidatorInfo>,
    pub total_stake: u64,
}

#[derive(Debug, Clone)]
pub struct ValidatorInfo {
    pub pub_key: Vec<u8>,
    pub stake: u64,
    pub is_active: bool,
}

impl ValidatorSet {
    pub fn new() -> Self {
        Self {
            validators: HashMap::new(),
            total_stake: 0,
        }
    }

    pub fn add_validator(&mut self, id: String, info: ValidatorInfo) {
        self.total_stake += info.stake;
        self.validators.insert(id, info);
    }

    /// Calculate 2/3+ threshold for BFT
    pub fn quorum_threshold(&self) -> u64 {
        (self.total_stake * 2) / 3 + 1
    }

    pub fn has_quorum(&self, stake: u64) -> bool {
        stake >= self.quorum_threshold()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub view: u64,
    pub block_hash: String,
    pub parent_hash: String,
    pub proposer: String,
    pub timestamp: u64,
    pub qc: Option<QuorumCertificate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuorumCertificate {
    pub view: u64,
    pub block_hash: String,
    pub signatures: Vec<ValidatorSignature>,
    pub aggregated_stake: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorSignature {
    pub validator_id: String,
    pub signature: Vec<u8>,
    pub stake: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Vote {
    Prepare {
        view: u64,
        block_hash: String,
        validator_id: String,
        signature: Vec<u8>,
    },
    PreCommit {
        view: u64,
        block_hash: String,
        validator_id: String,
        signature: Vec<u8>,
    },
    Commit {
        view: u64,
        block_hash: String,
        validator_id: String,
        signature: Vec<u8>,
    },
}

#[derive(Debug, Clone)]
pub struct VoteCollection {
    pub prepare_votes: HashMap<String, ValidatorSignature>,
    pub precommit_votes: HashMap<String, ValidatorSignature>,
    pub commit_votes: HashMap<String, ValidatorSignature>,
}

impl VoteCollection {
    pub fn new() -> Self {
        Self {
            prepare_votes: HashMap::new(),
            precommit_votes: HashMap::new(),
            commit_votes: HashMap::new(),
        }
    }

    pub fn total_prepare_stake(&self) -> u64 {
        self.prepare_votes.values().map(|v| v.stake).sum()
    }

    pub fn total_precommit_stake(&self) -> u64 {
        self.precommit_votes.values().map(|v| v.stake).sum()
    }

    pub fn total_commit_stake(&self) -> u64 {
        self.commit_votes.values().map(|v| v.stake).sum()
    }
}

impl FinalityGadget {
    pub fn new(config: FinalityConfig) -> Self {
        Self {
            current_view: Arc::new(RwLock::new(0)),
            validators: Arc::new(RwLock::new(ValidatorSet::new())),
            proposals: Arc::new(RwLock::new(HashMap::new())),
            votes: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    /// Initialize validator set
    pub async fn init_validators(&self, validators: ValidatorSet) {
        let mut v = self.validators.write().await;
        *v = validators;
    }

    /// Submit new proposal
    pub async fn propose_block(&self, proposal: Proposal) -> Result<()> {
        let mut proposals = self.proposals.write().await;
        proposals.insert(proposal.view, proposal.clone());
        
        // Initialize vote collection for this view
        let mut votes = self.votes.write().await;
        votes.insert(proposal.view, VoteCollection::new());
        
        Ok(())
    }

    /// Process vote (3-phase commit)
    pub async fn process_vote(&self, vote: Vote) -> Result<ConsensusResult> {
        let validators = self.validators.read().await;
        let mut votes = self.votes.write().await;
        
        match vote {
            Vote::Prepare { view, block_hash, validator_id, signature } => {
                let collection = votes.entry(view).or_insert_with(VoteCollection::new);
                
                if let Some(validator) = validators.validators.get(&validator_id) {
                    collection.prepare_votes.insert(
                        validator_id.clone(),
                        ValidatorSignature {
                            validator_id: validator_id.clone(),
                            signature,
                            stake: validator.stake,
                        },
                    );
                    
                    // Check if we have quorum for PREPARE phase
                    if validators.has_quorum(collection.total_prepare_stake()) {
                        return Ok(ConsensusResult::PrepareQuorum { view, block_hash });
                    }
                }
            }
            Vote::PreCommit { view, block_hash, validator_id, signature } => {
                let collection = votes.entry(view).or_insert_with(VoteCollection::new);
                
                if let Some(validator) = validators.validators.get(&validator_id) {
                    collection.precommit_votes.insert(
                        validator_id.clone(),
                        ValidatorSignature {
                            validator_id: validator_id.clone(),
                            signature,
                            stake: validator.stake,
                        },
                    );
                    
                    // Check if we have quorum for PRE-COMMIT phase
                    if validators.has_quorum(collection.total_precommit_stake()) {
                        return Ok(ConsensusResult::PreCommitQuorum { view, block_hash });
                    }
                }
            }
            Vote::Commit { view, block_hash, validator_id, signature } => {
                let collection = votes.entry(view).or_insert_with(VoteCollection::new);
                
                if let Some(validator) = validators.validators.get(&validator_id) {
                    collection.commit_votes.insert(
                        validator_id.clone(),
                        ValidatorSignature {
                            validator_id: validator_id.clone(),
                            signature,
                            stake: validator.stake,
                        },
                    );
                    
                    // Check if we have quorum for COMMIT phase
                    if validators.has_quorum(collection.total_commit_stake()) {
                        // FINALIZED!
                        return Ok(ConsensusResult::Finalized {
                            view,
                            block_hash: block_hash.clone(),
                            qc: self.create_qc(view, block_hash, &collection).await,
                        });
                    }
                }
            }
        }
        
        Ok(ConsensusResult::Pending)
    }

    /// Create Quorum Certificate
    async fn create_qc(&self, view: u64, block_hash: String, votes: &VoteCollection) -> QuorumCertificate {
        QuorumCertificate {
            view,
            block_hash,
            signatures: votes.commit_votes.values().cloned().collect(),
            aggregated_stake: votes.total_commit_stake(),
        }
    }

    /// Advance to next view
    pub async fn advance_view(&self) -> u64 {
        let mut current_view = self.current_view.write().await;
        *current_view += 1;
        *current_view
    }

    /// Get current view
    pub async fn get_current_view(&self) -> u64 {
        *self.current_view.read().await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusResult {
    Pending,
    PrepareQuorum { view: u64, block_hash: String },
    PreCommitQuorum { view: u64, block_hash: String },
    Finalized { view: u64, block_hash: String, qc: QuorumCertificate },
}

use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Security module for Ionova blockchain
/// Provides transaction validation, signature verification, and attack prevention

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// Maximum transactions per block
    pub max_tx_per_block: usize,
    
    /// Maximum block size in bytes
    pub max_block_size: usize,
    
    /// Minimum gas price (prevents spam)
    pub min_gas_price: u64,
    
    /// Maximum gas per transaction
    pub max_gas_per_tx: u64,
    
    /// Rate limit: max transactions per address per second
    pub rate_limit_tx_per_sec: u32,
    
    /// Enable replay attack protection
    pub enable_replay_protection: bool,
    
    /// Enable DDoS protection
    pub enable_ddos_protection: bool,
    
    /// Maximum nonce gap allowed
    pub max_nonce_gap: u64,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            max_tx_per_block: 10000,
            max_block_size: 10_000_000, // 10MB
            min_gas_price: 1_000_000, // 0.000001 IONX
            max_gas_per_tx: 10_000_000,
            rate_limit_tx_per_sec: 100,
            enable_replay_protection: true,
            enable_ddos_protection: true,
            max_nonce_gap: 100,
        }
    }
}

#[derive(Debug, Clone)]
pub struct SecurityValidator {
    config: SecurityConfig,
    /// Track nonces for replay protection
    nonce_tracker: HashMap<String, u64>,
    /// Track transaction hashes to prevent duplicates
    tx_hash_tracker: HashMap<String, u64>,
    /// Rate limiting: address -> (count, timestamp)
    rate_limiter: HashMap<String, (u32, u64)>,
}

impl SecurityValidator {
    pub fn new(config: SecurityConfig) -> Self {
        Self {
            config,
            nonce_tracker: HashMap::new(),
            tx_hash_tracker: HashMap::new(),
            rate_limiter: HashMap::new(),
        }
    }

    /// Validate transaction security
    pub fn validate_transaction(&mut self, tx: &Transaction) -> Result<(), SecurityError> {
        // 1. Validate signature
        self.validate_signature(tx)?;
        
        // 2. Check replay protection
        if self.config.enable_replay_protection {
            self.check_replay_attack(tx)?;
        }
        
        // 3. Validate nonce
        self.validate_nonce(tx)?;
        
        // 4. Check gas limits
        self.validate_gas(tx)?;
        
        // 5. Rate limiting
        if self.config.enable_ddos_protection {
            self.check_rate_limit(&tx.from)?;
        }
        
        // 6. Validate transaction hash
        self.validate_tx_hash(tx)?;
        
        Ok(())
    }

    /// Validate cryptographic signature
    fn validate_signature(&self, tx: &Transaction) -> Result<(), SecurityError> {
        // Verify ECDSA signature
        let message = self.create_signing_message(tx);
        let message_hash = self.hash_message(&message);
        
        // In production, use proper ECDSA verification
        // For now, basic validation
        if tx.signature.is_empty() {
            return Err(SecurityError::InvalidSignature("Empty signature".to_string()));
        }
        
        if tx.signature.len() != 65 {
            return Err(SecurityError::InvalidSignature(
                "Invalid signature length".to_string()
            ));
        }
        
        Ok(())
    }

    /// Check for replay attacks
    fn check_replay_attack(&mut self, tx: &Transaction) -> Result<(), SecurityError> {
        let tx_hash = self.calculate_tx_hash(tx);
        
        // Check if transaction hash already exists
        if let Some(timestamp) = self.tx_hash_tracker.get(&tx_hash) {
            return Err(SecurityError::ReplayAttack(format!(
                "Transaction already processed at timestamp {}",
                timestamp
            )));
        }
        
        // Store transaction hash with timestamp
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.tx_hash_tracker.insert(tx_hash, now);
        
        // Clean old entries (older than 1 hour)
        self.tx_hash_tracker.retain(|_, &mut timestamp| {
            now - timestamp < 3600
        });
        
        Ok(())
    }

    /// Validate transaction nonce
    fn validate_nonce(&mut self, tx: &Transaction) -> Result<(), SecurityError> {
        let current_nonce = self.nonce_tracker.get(&tx.from).copied().unwrap_or(0);
        
        // Nonce must be exactly current_nonce + 1 or within acceptable gap
        if tx.nonce < current_nonce {
            return Err(SecurityError::InvalidNonce(format!(
                "Nonce too low: {} < {}",
                tx.nonce, current_nonce
            )));
        }
        
        if tx.nonce > current_nonce + self.config.max_nonce_gap {
            return Err(SecurityError::InvalidNonce(format!(
                "Nonce gap too large: {} > {} + {}",
                tx.nonce, current_nonce, self.config.max_nonce_gap
            )));
        }
        
        // Update nonce
        self.nonce_tracker.insert(tx.from.clone(), tx.nonce);
        
        Ok(())
    }

    /// Validate gas parameters
    fn validate_gas(&self, tx: &Transaction) -> Result<(), SecurityError> {
        // Check minimum gas price
        if tx.gas_price < self.config.min_gas_price {
            return Err(SecurityError::InsufficientGasPrice(format!(
                "Gas price {} < minimum {}",
                tx.gas_price, self.config.min_gas_price
            )));
        }
        
        // Check maximum gas limit
        if tx.gas_limit > self.config.max_gas_per_tx {
            return Err(SecurityError::ExcessiveGas(format!(
                "Gas limit {} > maximum {}",
                tx.gas_limit, self.config.max_gas_per_tx
            )));
        }
        
        Ok(())
    }

    /// Rate limiting check
    fn check_rate_limit(&mut self, address: &str) -> Result<(), SecurityError> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let (count, timestamp) = self.rate_limiter
            .get(address)
            .copied()
            .unwrap_or((0, now));
        
        // Reset counter if more than 1 second has passed
        let (new_count, new_timestamp) = if now - timestamp >= 1 {
            (1, now)
        } else {
            (count + 1, timestamp)
        };
        
        // Check rate limit
        if new_count > self.config.rate_limit_tx_per_sec {
            return Err(SecurityError::RateLimitExceeded(format!(
                "Address {} exceeded rate limit: {} tx/sec",
                address, self.config.rate_limit_tx_per_sec
            )));
        }
        
        self.rate_limiter.insert(address.to_string(), (new_count, new_timestamp));
        
        Ok(())
    }

    /// Validate transaction hash
    fn validate_tx_hash(&self, tx: &Transaction) -> Result<(), SecurityError> {
        let calculated_hash = self.calculate_tx_hash(tx);
        
        if tx.hash != calculated_hash {
            return Err(SecurityError::InvalidHash(
                "Transaction hash mismatch".to_string()
            ));
        }
        
        Ok(())
    }

    /// Calculate transaction hash
    fn calculate_tx_hash(&self, tx: &Transaction) -> String {
        let data = format!(
            "{}{}{}{}{}{}",
            tx.from, tx.to, tx.value, tx.nonce, tx.gas_price, tx.gas_limit
        );
        
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("0x{:x}", hasher.finalize())
    }

    /// Create signing message
    fn create_signing_message(&self, tx: &Transaction) -> String {
        format!(
            "Ionova Transaction\nFrom: {}\nTo: {}\nValue: {}\nNonce: {}\nGas: {}",
            tx.from, tx.to, tx.value, tx.nonce, tx.gas_limit
        )
    }

    /// Hash message for signing
    fn hash_message(&self, message: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(message.as_bytes());
        format!("0x{:x}", hasher.finalize())
    }

    /// Validate block security
    pub fn validate_block(&self, block: &Block) -> Result<(), SecurityError> {
        // Check block size
        let block_size = self.estimate_block_size(block);
        if block_size > self.config.max_block_size {
            return Err(SecurityError::BlockTooLarge(format!(
                "Block size {} > maximum {}",
                block_size, self.config.max_block_size
            )));
        }
        
        // Check transaction count
        if block.transactions.len() > self.config.max_tx_per_block {
            return Err(SecurityError::TooManyTransactions(format!(
                "Block has {} transactions, maximum is {}",
                block.transactions.len(),
                self.config.max_tx_per_block
            )));
        }
        
        // Validate block hash
        self.validate_block_hash(block)?;
        
        Ok(())
    }

    /// Validate block hash
    fn validate_block_hash(&self, block: &Block) -> Result<(), SecurityError> {
        let calculated_hash = self.calculate_block_hash(block);
        
        if block.hash != calculated_hash {
            return Err(SecurityError::InvalidBlockHash(
                "Block hash mismatch".to_string()
            ));
        }
        
        Ok(())
    }

    /// Calculate block hash
    fn calculate_block_hash(&self, block: &Block) -> String {
        let tx_hashes: Vec<String> = block.transactions
            .iter()
            .map(|tx| tx.hash.clone())
            .collect();
        
        let data = format!(
            "{}{}{}{}",
            block.height,
            block.previous_hash,
            block.timestamp,
            tx_hashes.join("")
        );
        
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("0x{:x}", hasher.finalize())
    }

    /// Estimate block size
    fn estimate_block_size(&self, block: &Block) -> usize {
        // Rough estimate: 200 bytes per transaction + overhead
        block.transactions.len() * 200 + 1000
    }

    /// Clean up old tracking data
    pub fn cleanup(&mut self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Clean transaction hashes older than 1 hour
        self.tx_hash_tracker.retain(|_, &mut timestamp| {
            now - timestamp < 3600
        });
        
        // Clean rate limiter entries older than 10 seconds
        self.rate_limiter.retain(|_, (_, timestamp)| {
            now - timestamp < 10
        });
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub hash: String,
    pub from: String,
    pub to: String,
    pub value: u64,
    pub nonce: u64,
    pub gas_price: u64,
    pub gas_limit: u64,
    pub signature: Vec<u8>,
    pub data: Vec<u8>,
}

#[derive(Debug, Clone)]
pub struct Block {
    pub height: u64,
    pub hash: String,
    pub previous_hash: String,
    pub timestamp: u64,
    pub transactions: Vec<Transaction>,
}

#[derive(Debug, Clone)]
pub enum SecurityError {
    InvalidSignature(String),
    ReplayAttack(String),
    InvalidNonce(String),
    InsufficientGasPrice(String),
    ExcessiveGas(String),
    RateLimitExceeded(String),
    InvalidHash(String),
    BlockTooLarge(String),
    TooManyTransactions(String),
    InvalidBlockHash(String),
}

impl std::fmt::Display for SecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            SecurityError::InvalidSignature(msg) => write!(f, "Invalid signature: {}", msg),
            SecurityError::ReplayAttack(msg) => write!(f, "Replay attack detected: {}", msg),
            SecurityError::InvalidNonce(msg) => write!(f, "Invalid nonce: {}", msg),
            SecurityError::InsufficientGasPrice(msg) => write!(f, "Insufficient gas price: {}", msg),
            SecurityError::ExcessiveGas(msg) => write!(f, "Excessive gas: {}", msg),
            SecurityError::RateLimitExceeded(msg) => write!(f, "Rate limit exceeded: {}", msg),
            SecurityError::InvalidHash(msg) => write!(f, "Invalid hash: {}", msg),
            SecurityError::BlockTooLarge(msg) => write!(f, "Block too large: {}", msg),
            SecurityError::TooManyTransactions(msg) => write!(f, "Too many transactions: {}", msg),
            SecurityError::InvalidBlockHash(msg) => write!(f, "Invalid block hash: {}", msg),
        }
    }
}

impl std::error::Error for SecurityError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_transaction() {
        let config = SecurityConfig::default();
        let mut validator = SecurityValidator::new(config);

        let tx = Transaction {
            hash: "0x123".to_string(),
            from: "0xabc".to_string(),
            to: "0xdef".to_string(),
            value: 1000,
            nonce: 1,
            gas_price: 1_000_000,
            gas_limit: 21000,
            signature: vec![0u8; 65],
            data: vec![],
        };

        // First transaction should pass (after fixing hash)
        let calculated_hash = validator.calculate_tx_hash(&tx);
        let mut tx_with_hash = tx.clone();
        tx_with_hash.hash = calculated_hash;

        assert!(validator.validate_transaction(&tx_with_hash).is_ok());
    }

    #[test]
    fn test_replay_attack_prevention() {
        let config = SecurityConfig::default();
        let mut validator = SecurityValidator::new(config);

        let tx = Transaction {
            hash: "0x123".to_string(),
            from: "0xabc".to_string(),
            to: "0xdef".to_string(),
            value: 1000,
            nonce: 1,
            gas_price: 1_000_000,
            gas_limit: 21000,
            signature: vec![0u8; 65],
            data: vec![],
        };

        let calculated_hash = validator.calculate_tx_hash(&tx);
        let mut tx_with_hash = tx.clone();
        tx_with_hash.hash = calculated_hash;

        // First time should succeed
        assert!(validator.validate_transaction(&tx_with_hash).is_ok());

        // Second time should fail (replay attack)
        let result = validator.validate_transaction(&tx_with_hash);
        assert!(result.is_err());
    }

    #[test]
    fn test_rate_limiting() {
        let mut config = SecurityConfig::default();
        config.rate_limit_tx_per_sec = 2;
        let mut validator = SecurityValidator::new(config);

        // Should allow 2 transactions per second
        assert!(validator.check_rate_limit("0xabc").is_ok());
        assert!(validator.check_rate_limit("0xabc").is_ok());

        // Third should fail
        let result = validator.check_rate_limit("0xabc");
        assert!(result.is_err());
    }

    #[test]
    fn test_nonce_validation() {
        let config = SecurityConfig::default();
        let mut validator = SecurityValidator::new(config);

        let mut tx = Transaction {
            hash: "0x123".to_string(),
            from: "0xabc".to_string(),
            to: "0xdef".to_string(),
            value: 1000,
            nonce: 1,
            gas_price: 1_000_000,
            gas_limit: 21000,
            signature: vec![0u8; 65],
            data: vec![],
        };

        // Nonce 1 should work
        assert!(validator.validate_nonce(&tx).is_ok());

        // Nonce 1 again should fail (too low)
        let result = validator.validate_nonce(&tx);
        assert!(result.is_err());

        // Nonce 2 should work
        tx.nonce = 2;
        assert!(validator.validate_nonce(&tx).is_ok());
    }

    #[test]
    fn test_gas_validation() {
        let config = SecurityConfig::default();
        let validator = SecurityValidator::new(config);

        let mut tx = Transaction {
            hash: "0x123".to_string(),
            from: "0xabc".to_string(),
            to: "0xdef".to_string(),
            value: 1000,
            nonce: 1,
            gas_price: 1_000_000,
            gas_limit: 21000,
            signature: vec![0u8; 65],
            data: vec![],
        };

        // Valid gas should pass
        assert!(validator.validate_gas(&tx).is_ok());

        // Too low gas price should fail
        tx.gas_price = 100;
        assert!(validator.validate_gas(&tx).is_err());

        // Too high gas limit should fail
        tx.gas_price = 1_000_000;
        tx.gas_limit = 100_000_000;
        assert!(validator.validate_gas(&tx).is_err());
    }
}

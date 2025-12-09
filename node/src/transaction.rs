// Transaction structure with post-quantum signature support

use crate::crypto::{Address, PublicKeyData, Signature, SignatureAlgorithm};
use anyhow::Result;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Transaction with multi-signature support
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Transaction nonce (prevents replay attacks)
    pub nonce: u64,
    
    /// Sender address
    pub from: Address,
    
    /// Recipient address
    pub to: Address,
    
    /// Amount to transfer (in IONX)
    pub value: Decimal,
    
    /// Gas limit
    pub gas_limit: u64,
    
    /// Gas price (in IONX per gas unit)
    pub gas_price: Decimal,
    
    /// Optional data payload
    pub data: Vec<u8>,
    
    /// Transaction signature
    pub signature: Signature,
    
    /// Public key for verification
    pub public_key: PublicKeyData,
    
    /// SECURITY FIX M-4: Transaction expiry (Unix timestamp)
    pub expiry: Option<u64>,
}

impl Transaction {
    /// Create hash of transaction for signing
    pub fn hash(&self) -> [u8; 32] {
        let mut hasher = Sha256::new();
        
        // Hash transaction fields (excluding signature)
        hasher.update(self.nonce.to_le_bytes());
        hasher.update(self.value.to_string().as_bytes());
        hasher.update(self.gas_limit.to_le_bytes());
        hasher.update(self.gas_price.to_string().as_bytes());
        hasher.update(&self.data);
        
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }
    
    /// Verify transaction signature
    pub fn verify_signature(&self) -> Result<bool> {
        let message = self.hash();
        self.signature.verify(&message, &self.public_key)
    }
    
    /// Calculate gas cost with signature type consideration
    /// SECURITY FIX M-1: Added overflow protection
    pub fn calculate_gas_cost(&self) -> Result<u64> {
        let base_gas = 21_000u64; // Base transaction cost
        
        // Signature verification cost varies by algorithm
        let sig_gas = match self.signature.algorithm() {
            SignatureAlgorithm::ECDSA => 3_000,
            SignatureAlgorithm::Dilithium => {
                // Higher verification cost, but subsidized 50%
                let actual_cost = 50_000;
                actual_cost / 2 // Subsidy during migration period
            }
            SignatureAlgorithm::SPHINCSPlus => {
                // SPHINCS+ is slower
                let actual_cost = 70_000;
                actual_cost / 2 // Subsidy
            }
            SignatureAlgorithm::Hybrid => {
                // Both signatures verified
                3_000 + 25_000 // ECDSA + subsidized PQ
            }
        };
        
        // SECURITY FIX M-1: Protected data gas calculation
        let data_gas = (self.data.len() as u64)
            .checked_mul(16)
            .ok_or(anyhow::anyhow!("Data size causes gas overflow"))?;
        
        // SECURITY FIX M-1: Protected total calculation
        let total = base_gas
            .checked_add(sig_gas)
            .and_then(|sum| sum.checked_add(data_gas))
            .ok_or(anyhow::anyhow!("Total gas cost overflow"))?;
        
        Ok(total)
    }
    
    /// Calculate total fee (gas cost × gas price)
    pub fn calculate_fee(&self) -> Result<Decimal> {
        let gas_used = Decimal::from(self.calculate_gas_cost()?);
        Ok(gas_used * self.gas_price)
    }
    
    /// SECURITY FIX M-4: Validate nonce against account state
    pub fn validate_nonce(&self, account_nonce: u64) -> Result<()> {
        if self.nonce < account_nonce {
            return Err(anyhow::anyhow!("Nonce too low (already used)"));
        }
        if self.nonce > account_nonce {
            return Err(anyhow::anyhow!("Nonce too high (must be sequential)"));
        }
        Ok(())
    }
    
    /// SECURITY FIX M-4: Check if transaction is expired
    pub fn is_expired(&self, current_time: u64) -> bool {
        if let Some(expiry) = self.expiry {
            current_time > expiry
        } else {
            false
        }
    }
}

/// Transaction builder for easier construction
pub struct TransactionBuilder {
    nonce: u64,
    from: Option<Address>,
    to: Option<Address>,
    value: Decimal,
    gas_limit: u64,
    gas_price: Decimal,
    data: Vec<u8>,
}

impl TransactionBuilder {
    pub fn new() -> Self {
        Self {
            nonce: 0,
            from: None,
            to: None,
            value: dec!(0),
            gas_limit: 21_000,
            gas_price: dec!(0.000001), // Default gas price
            data: Vec::new(),
        }
    }
    
    pub fn nonce(mut self, nonce: u64) -> Self {
        self.nonce = nonce;
        self
    }
    
    pub fn from(mut self, from: Address) -> Self {
        self.from = Some(from);
        self
    }
    
    pub fn to(mut self, to: Address) -> Self {
        self.to = Some(to);
        self
    }
    
    /// SECURITY FIX H-2: Add input validation
    pub fn value(mut self, value: Decimal) -> Result<Self> {
        if value < dec!(0) {
            return Err(anyhow::anyhow!("Value cannot be negative"));
        }
        if value > dec!(10_000_000_000) {
            return Err(anyhow::anyhow!("Value exceeds max supply (10B IONX)"));
        }
        self.value = value;
        Ok(self)
    }
    
    /// SECURITY FIX H-2: Validate gas limit
    pub fn gas_limit(mut self, gas_limit: u64) -> Result<Self> {
        if gas_limit < 21_000 {
            return Err(anyhow::anyhow!("Gas limit too low (min: 21,000)"));
        }
        if gas_limit > 10_000_000 {
            return Err(anyhow::anyhow!("Gas limit too high (max: 10M)"));
        }
        self.gas_limit = gas_limit;
        Ok(self)
    }
    
    pub fn gas_price(mut self, gas_price: Decimal) -> Self {
        self.gas_price = gas_price;
        self
    }
    
    /// SECURITY FIX H-2: Validate data size
    pub fn data(mut self, data: Vec<u8>) -> Result<Self> {
        if data.len() > 1_000_000 {  // 1MB limit
            return Err(anyhow::anyhow!("Data too large (max: 1MB)"));
        }
        self.data = data;
        Ok(self)
    }
    
    /// Set transaction expiry
    pub fn expiry(mut self, expiry: u64) -> Self {
        self.expiry = Some(expiry);
        self
    }
    
    pub fn build(
        self,
        signature: Signature,
        public_key: PublicKeyData,
    ) -> Result<Transaction> {
        Ok(Transaction {
            nonce: self.nonce,
            from: self.from.ok_or(anyhow::anyhow!("From address required"))?,
            to: self.to.ok_or(anyhow::anyhow!("To address required"))?,
            value: self.value,
            gas_limit: self.gas_limit,
            gas_price: self.gas_price,
            data: self.data,
            signature,
            public_key,
            expiry: None,  // Can be set via expiry() method
        })
    }
}

impl Default for TransactionBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::Signature;

    #[test]
    fn test_gas_cost_ecdsa() {
        let tx = Transaction {
            nonce: 1,
            from: Address::EVM([0u8; 20]),
            to: Address::EVM([1u8; 20]),
            value: dec!(100),
            gas_limit: 21_000,
            gas_price: dec!(0.000001),
            data: vec![],
            signature: Signature::ECDSA {
                r: [0u8; 32],
                s: [0u8; 32],
                v: 0,
            },
            public_key: PublicKeyData::ECDSA { bytes: [0u8; 33] },
        };
        
        assert_eq!(tx.calculate_gas_cost().unwrap(), 24_000); // 21k base + 3k sig
    }
    
    #[test]
    fn test_gas_cost_dilithium_subsidized() {
        let tx = Transaction {
            nonce: 1,
            from: Address::EVM([0u8; 20]),
            to: Address::EVM([1u8; 20]),
            value: dec!(100),
            gas_limit: 50_000,
            gas_price: dec!(0.000001),
            data: vec![],
            signature: Signature::Dilithium { data: vec![0u8; 2420] },
            public_key: PublicKeyData::Dilithium { bytes: vec![0u8; 2528] },
        };
        
        // 21k base + 25k subsidized (50k / 2)
        assert_eq!(tx.calculate_gas_cost().unwrap(), 46_000);
    }
    
    #[test]
    fn test_transaction_builder() {
        let from = Address::EVM([0u8; 20]);
        let to = Address::EVM([1u8; 20]);
        
        let tx = TransactionBuilder::new()
            .nonce(5)
            .from(from)
            .to(to)
            .value(dec!(50)).unwrap()
            .gas_limit(25_000)
            .build(
                Signature::ECDSA {
                    r: [0u8; 32],
                    s: [0u8; 32],
                    v: 0,
                },
                PublicKeyData::ECDSA { bytes: [0u8; 33] },
            )
            .unwrap();
        
        assert_eq!(tx.nonce, 5);
        assert_eq!(tx.value, dec!(50));
        assert_eq!(tx.gas_limit, 25_000);
    }
}

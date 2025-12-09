// Post-Quantum Signature Support Module
// Implements multi-signature verification for quantum-safe transactions

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tracing::{debug, info, warn, error}; // SECURITY FIX L-2

// Post-quantum crypto imports
use pqcrypto_dilithium::dilithium5;
use pqcrypto_sphincsplus::sphincssha2256256frobust;
use pqcrypto_traits::sign::{PublicKey as PQPublicKey, SecretKey as PQSecretKey, SignedMessage};

// ECDSA imports
use secp256k1::{ecdsa::Signature as ECDSASignature, Message, PublicKey, Secp256k1, SecretKey};

/// Supported signature algorithms
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignatureAlgorithm {
    /// ECDSA (secp256k1) - compatible with Ethereum/Bitcoin wallets
    /// Quantum-vulnerable but widely supported
    ECDSA,
    
    /// Dilithium (NIST PQ standard) - recommended for users
    /// Balanced size/speed trade-off
    Dilithium,
    
    /// SPHINCS+ - ultra-conservative, hash-based
    /// Used by validators for consensus
    SPHINCSPlus,
    
    /// Hybrid - both ECDSA and PQ signature
    /// Maximum security during transition period
    Hybrid,
}

/// Multi-algorithm signature container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Signature {
    ECDSA {
        r: [u8; 32],
        s: [u8; 32],
        v: u8,
    },
    Dilithium {
        data: Vec<u8>, // ~4,595 bytes
    },
    SPHINCSPlus {
        data: Vec<u8>, // ~2,048 bytes
    },
    Hybrid {
        ecdsa: Box<Signature>,
        pq: Box<Signature>,
    },
}

impl Signature {
    /// Get the signature algorithm type
    pub fn algorithm(&self) -> SignatureAlgorithm {
        match self {
            Signature::ECDSA { .. } => SignatureAlgorithm::ECDSA,
            Signature::Dilithium { .. } => SignatureAlgorithm::Dilithium,
            Signature::SPHINCSPlus { .. } => SignatureAlgorithm::SPHINCSPlus,
            Signature::Hybrid { .. } => SignatureAlgorithm::Hybrid,
        }
    }

    /// Get signature size in bytes
    pub fn size(&self) -> usize {
        match self {
            Signature::ECDSA { .. } => 65,
            Signature::Dilithium { data } => data.len(),
            Signature::SPHINCSPlus { data } => data.len(),
            Signature::Hybrid { ecdsa, pq } => ecdsa.size() + pq.size(),
        }
    }

    /// Verify signature against message and public key
    /// Verify signature against message and public key
    /// SECURITY FIX L-2: Added comprehensive logging
    pub fn verify(&self, message: &[u8], public_key: &PublicKeyData) -> Result<bool> {
        let algorithm = self.algorithm();
        debug!(
            algorithm = ?algorithm,
            message_len = message.len(),
            "Starting signature verification"
        );
        
        let result = match self {
            Signature::ECDSA { r, s, v } => {
                verify_ecdsa(message, *r, *s, *v, public_key)
            }
            Signature::Dilithium { data } => {
                verify_dilithium(message, data, public_key)
            }
            Signature::SPHINCSPlus { data } => {
                verify_sphincs(message, data, public_key)
            }
            Signature::Hybrid { ecdsa, pq } => {
                // SECURITY FIX H-1: Ensure public key is also hybrid
                let PublicKeyData::Hybrid { 
                    ecdsa: ecdsa_pk, 
                    pq: pq_pk 
                } = public_key else {
                    error!("Hybrid signature verification failed: public key type mismatch");
                    return Err(anyhow!("Hybrid signature requires hybrid public key"));
                };
                
                // Verify both signatures with correct keys
                let ecdsa_valid = ecdsa.verify(message, &**ecdsa_pk)?;
                let pq_valid = pq.verify(message, &**pq_pk)?;
                
                // Both must be valid
                Ok(ecdsa_valid && pq_valid)
            }
        };
        
        match &result {
            Ok(true) => {
                info!(
                    algorithm = ?algorithm,
                    "Signature verification succeeded"
                );
            }
            Ok(false) => {
                warn!(
                    algorithm = ?algorithm,
                    "Signature verification failed: invalid signature"
                );
            }
            Err(e) => {
                error!(
                    algorithm = ?algorithm,
                    error = %e,
                    "Signature verification error"
                );
            }
        }
        
        result
    }
}

/// Public key for any supported algorithm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PublicKeyData {
    ECDSA {
        bytes: [u8; 33], // Compressed public key
    },
    Dilithium {
        bytes: Vec<u8>, // 2,528 bytes (Dilithium5)
    },
    SPHINCSPlus {
        bytes: Vec<u8>, // 64 bytes
    },
    Hybrid {
        ecdsa: Box<PublicKeyData>,
        pq: Box<PublicKeyData>,
    },
}

impl PublicKeyData {
    /// Get the address derived from this public key
    pub fn to_address(&self) -> Address {
        match self {
            PublicKeyData::ECDSA { bytes } => {
                // Ethereum-style address (last 20 bytes of keccak256)
                let hash = Sha256::digest(bytes);
                let mut addr = [0u8; 20];
                addr.copy_from_slice(&hash[12..32]);
                Address::EVM(addr)
            }
            PublicKeyData::Dilithium { bytes }
            | PublicKeyData::SPHINCSPlus { bytes } => {
                // Hash-based address for PQ keys
                let hash = Sha256::digest(bytes);
                let mut addr = [0u8; 32];
                addr.copy_from_slice(&hash);
                Address::Native(addr)
            }
            PublicKeyData::Hybrid { ecdsa, .. } => {
                // Hybrid uses ECDSA address for compatibility
                ecdsa.to_address()
            }
        }
    }
}

/// Address format
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Address {
    /// EVM-compatible address (20 bytes, 0x...)
    EVM([u8; 20]),
    /// Native quantum-safe address (32 bytes, ionova1...)
    Native([u8; 32]),
}

/// Verify ECDSA signature (secp256k1)
fn verify_ecdsa(
    message: &[u8],
    r: [u8; 32],
    s: [u8; 32],
    v: u8,
    public_key: &PublicKeyData,
) -> Result<bool> {
    let PublicKeyData::ECDSA { bytes: pk_bytes } = public_key else {
        return Err(anyhow!("Public key type mismatch"));
    };

    let secp = Secp256k1::new();
    
    // Hash message
    let msg_hash = Sha256::digest(message);
    let msg = Message::from_digest_slice(&msg_hash)
        .map_err(|e| anyhow!("Invalid message: {}", e))?;

    // Reconstruct signature
    let mut sig_bytes = [0u8; 64];
    sig_bytes[..32].copy_from_slice(&r);
    sig_bytes[32..].copy_from_slice(&s);
    let sig = ECDSASignature::from_compact(&sig_bytes)
        .map_err(|e| anyhow!("Invalid signature: {}", e))?;

    // Parse public key
    let pubkey = PublicKey::from_slice(pk_bytes)
        .map_err(|e| anyhow!("Invalid public key: {}", e))?;

    // Verify
    Ok(secp.verify_ecdsa(&msg, &sig, &pubkey).is_ok())
}

/// Verify Dilithium signature
fn verify_dilithium(
    message: &[u8],
    signature: &[u8],
    public_key: &PublicKeyData,
) -> Result<bool> {
    let PublicKeyData::Dilithium { bytes: pk_bytes } = public_key else {
        return Err(anyhow!("Public key type mismatch"));
    };

    // SECURITY FIX M-7: Validate expected sizes
    const DILITHIUM5_PK_SIZE: usize = 2528;
    const DILITHIUM5_SIG_SIZE: usize = 4595;
    
    if pk_bytes.len() != DILITHIUM5_PK_SIZE {
        return Err(anyhow!(
            "Invalid Dilithium public key size: expected {}, got {}",
            DILITHIUM5_PK_SIZE,
            pk_bytes.len()
        ));
    }
    
    if signature.len() != DILITHIUM5_SIG_SIZE {
        return Err(anyhow!(
            "Invalid Dilithium signature size: expected {}, got {}",
            DILITHIUM5_SIG_SIZE,
            signature.len()
        ));
    }

    // Parse public key
    let pk = dilithium5::PublicKey::from_bytes(pk_bytes)
        .map_err(|e| anyhow!("Invalid Dilithium public key: {:?}", e))?;

    // Combine message and signature for verification
    let mut signed_msg = Vec::with_capacity(message.len() + signature.len());
    signed_msg.extend_from_slice(signature);
    signed_msg.extend_from_slice(message);

    // Verify
    match dilithium5::open(&signed_msg, &pk) {
        Ok(verified_msg) => Ok(verified_msg == message),
        Err(_) => Ok(false),
    }
}

/// Verify SPHINCS+ signature
fn verify_sphincs(
    message: &[u8],
    signature: &[u8],
    public_key: &PublicKeyData,
) -> Result<bool> {
    let PublicKeyData::SPHINCSPlus { bytes: pk_bytes } = public_key else {
        return Err(anyhow!("Public key type mismatch"));
    };

    // Parse public key
    let pk = sphincssha2256256frobust::PublicKey::from_bytes(pk_bytes)
        .map_err(|e| anyhow!("Invalid SPHINCS+ public key: {:?}", e))?;

    // Combine message and signature
    let mut signed_msg = Vec::with_capacity(message.len() + signature.len());
    signed_msg.extend_from_slice(signature);
    signed_msg.extend_from_slice(message);

    // Verify
    match sphincssha2256256frobust::open(&signed_msg, &pk) {
        Ok(verified_msg) => Ok(verified_msg == message),
        Err(_) => Ok(false),
    }
}

// SECURITY FIX H-3: Falcon removed until properly implemented

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signature_sizes() {
        let ecdsa_sig = Signature::ECDSA {
            r: [0u8; 32],
            s: [0u8; 32],
            v: 0,
        };
        assert_eq!(ecdsa_sig.size(), 65);

        let dilithium_sig = Signature::Dilithium {
            data: vec![0u8; 2420],
        };
        assert_eq!(dilithium_sig.size(), 2420);
    }

    #[test]
    fn test_signature_algorithm() {
        let sig = Signature::ECDSA {
            r: [0u8; 32],
            s: [0u8; 32],
            v: 0,
        };
        assert_eq!(sig.algorithm(), SignatureAlgorithm::ECDSA);
    }
}

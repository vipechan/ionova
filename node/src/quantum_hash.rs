use sha2::Sha256;
use sha3::{Sha3_256, Sha3_512, Digest as Sha3Digest};
use blake3::Hasher as Blake3Hasher;
use serde::{Serialize, Deserialize};

/// Quantum-resistant hash algorithms
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum HashAlgorithm {
    /// SHA-256 (current standard, not quantum-resistant)
    SHA256,
    
    /// SHA3-256 (quantum-resistant, NIST standard)
    SHA3_256,
    
    /// SHA3-512 (quantum-resistant, higher security)
    SHA3_512,
    
    /// BLAKE3 (quantum-resistant, fastest)
    BLAKE3,
}

/// Hash output wrapper
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Hash {
    pub algorithm: HashAlgorithm,
    pub bytes: Vec<u8>,
}

impl Hash {
    /// Create hash from data using specified algorithm
    pub fn new(data: &[u8], algorithm: HashAlgorithm) -> Self {
        let bytes = match algorithm {
            HashAlgorithm::SHA256 => {
                use sha2::Digest;
                let mut hasher = Sha256::new();
                hasher.update(data);
                hasher.finalize().to_vec()
            }
            HashAlgorithm::SHA3_256 => {
                let mut hasher = Sha3_256::new();
                hasher.update(data);
                hasher.finalize().to_vec()
            }
            HashAlgorithm::SHA3_512 => {
                let mut hasher = Sha3_512::new();
                hasher.update(data);
                hasher.finalize().to_vec()
            }
            HashAlgorithm::BLAKE3 => {
                let mut hasher = Blake3Hasher::new();
                hasher.update(data);
                hasher.finalize().as_bytes().to_vec()
            }
        };

        Self { algorithm, bytes }
    }

    /// Verify hash matches data
    pub fn verify(&self, data: &[u8]) -> bool {
        let computed = Self::new(data, self.algorithm);
        computed.bytes == self.bytes
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(&self.bytes)
    }

    /// Get hash size in bytes
    pub fn size(&self) -> usize {
        self.bytes.len()
    }
}

/// Quantum-resistant hashing utilities
pub struct QuantumHash;

impl QuantumHash {
    /// Default quantum-resistant algorithm (SHA3-256)
    pub const DEFAULT: HashAlgorithm = HashAlgorithm::SHA3_256;

    /// Hash transaction data
    pub fn hash_transaction(tx_data: &[u8]) -> Hash {
        Hash::new(tx_data, Self::DEFAULT)
    }

    /// Hash block header
    pub fn hash_block(block_data: &[u8]) -> Hash {
        // Use SHA3-512 for blocks (higher security)
        Hash::new(block_data, HashAlgorithm::SHA3_512)
    }

    /// Hash with Merkle tree (using BLAKE3 for speed)
    pub fn merkle_root(leaves: &[Vec<u8>]) -> Hash {
        if leaves.is_empty() {
            return Hash::new(&[], HashAlgorithm::BLAKE3);
        }

        // Hash all leaves
        let mut hashed_leaves: Vec<Vec<u8>> = leaves
            .iter()
            .map(|leaf| Hash::new(leaf, HashAlgorithm::BLAKE3).bytes)
            .collect();

        // Build Merkle tree
        while hashed_leaves.len() > 1 {
            let mut next_level = Vec::new();

            for chunk in hashed_leaves.chunks(2) {
                let combined = if chunk.len() == 2 {
                    [&chunk[0][..], &chunk[1][..]].concat()
                } else {
                    chunk[0].clone()
                };
                
                next_level.push(Hash::new(&combined, HashAlgorithm::BLAKE3).bytes);
            }

            hashed_leaves = next_level;
        }

        Hash {
            algorithm: HashAlgorithm::BLAKE3,
            bytes: hashed_leaves[0].clone(),
        }
    }

    /// Compare hash performance
    pub fn benchmark_algorithms(data: &[u8]) -> BenchmarkResults {
        use std::time::Instant;

        let algorithms = vec![
            HashAlgorithm::SHA256,
            HashAlgorithm::SHA3_256,
            HashAlgorithm::SHA3_512,
            HashAlgorithm::BLAKE3,
        ];

        let mut results = Vec::new();

        for algo in algorithms {
            let start = Instant::now();
            let _ = Hash::new(data, algo);
            let duration = start.elapsed();

            results.push((algo, duration));
        }

        BenchmarkResults { results }
    }
}

#[derive(Debug)]
pub struct BenchmarkResults {
    pub results: Vec<(HashAlgorithm, std::time::Duration)>,
}

impl BenchmarkResults {
    pub fn fastest(&self) -> HashAlgorithm {
        self.results
            .iter()
            .min_by_key(|(_, duration)| duration)
            .map(|(algo, _)| *algo)
            .unwrap_or(HashAlgorithm::BLAKE3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha3_hashing() {
        let data = b"Hello, Ionova!";
        let hash = Hash::new(data, HashAlgorithm::SHA3_256);
        
        assert_eq!(hash.size(), 32);
        assert!(hash.verify(data));
        assert!(!hash.verify(b"Different data"));
    }

    #[test]
    fn test_blake3_hashing() {
        let data = b"Quantum-safe blockchain";
        let hash = Hash::new(data, HashAlgorithm::BLAKE3);
        
        assert_eq!(hash.size(), 32);
        assert!(hash.verify(data));
    }

    #[test]
    fn test_merkle_root() {
        let leaves = vec![
            b"tx1".to_vec(),
            b"tx2".to_vec(),
            b"tx3".to_vec(),
        ];
        
        let root = QuantumHash::merkle_root(&leaves);
        assert_eq!(root.algorithm, HashAlgorithm::BLAKE3);
        assert_eq!(root.size(), 32);
    }

    #[test]
    fn test_benchmark() {
        let data = vec![0u8; 1024]; // 1KB data
        let results = QuantumHash::benchmark_algorithms(&data);
        
        // BLAKE3 should be fastest
        assert_eq!(results.fastest(), HashAlgorithm::BLAKE3);
    }
}

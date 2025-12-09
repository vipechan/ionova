// SECURITY FIX L-5: Configuration Management Module

use serde::{Deserialize, Serialize};
use std::fs;
use anyhow::Result;

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub chain_id: u64,
    pub rpc_port: u16,
    pub metrics_port: u16,
    pub shard_count: u8,
    pub max_block_size: u64,
}

/// Gas configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasConfig {
    pub base_transaction: u64,
    pub ecdsa_signature: u64,
    pub dilithium_signature: u64,
    pub sphincs_signature: u64,
    pub hybrid_signature: u64,
    pub data_per_byte: u64,
    pub subsidy_enabled: bool,
    pub subsidy_rate: f64, // 0.5 = 50% subsidy
}

/// Rate limiting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub global_requests_per_second: u32,
    pub per_ip_requests_per_second: u32,
    pub max_tracked_ips: usize,
}

/// Complete configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub network: NetworkConfig,
    pub gas: GasConfig,
    pub rate_limit: RateLimitConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            network: NetworkConfig {
                chain_id: 31337,
                rpc_port: 27000,
                metrics_port: 9100,
                shard_count: 100,
                max_block_size: 10_000_000,
            },
            gas: GasConfig {
                base_transaction: 21_000,
                ecdsa_signature: 3_000,
                dilithium_signature: 50_000,
                sphincs_signature: 70_000,
                hybrid_signature: 28_000,
                data_per_byte: 16,
                subsidy_enabled: true,
                subsidy_rate: 0.5,
            },
            rate_limit: RateLimitConfig {
                global_requests_per_second: 100,
                per_ip_requests_per_second: 10,
                max_tracked_ips: 10_000,
            },
        }
    }
}

impl Config {
    /// Load configuration from file
    pub fn load_from_file(path: &str) -> Result<Self> {
        let content = fs::read_to_string(path)?;
        let config: Config = toml::from_str(&content)?;
        Ok(config)
    }
    
    /// Save configuration to file
    pub fn save_to_file(&self, path: &str) -> Result<()> {
        let content = toml::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }
    
    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        if self.network.shard_count == 0 {
            return Err(anyhow::anyhow!("Shard count must be > 0"));
        }
        
        if self.gas.subsidy_rate < 0.0 || self.gas.subsidy_rate > 1.0 {
            return Err(anyhow::anyhow!("Subsidy rate must be between 0.0 and 1.0"));
        }
        
        if self.rate_limit.global_requests_per_second == 0 {
            return Err(anyhow::anyhow!("Global rate limit must be > 0"));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert!(config.validate().is_ok());
        assert_eq!(config.network.chain_id, 31337);
        assert_eq!(config.gas.subsidy_rate, 0.5);
    }
    
    #[test]
    fn test_invalid_subsidy_rate() {
        let mut config = Config::default();
        config.gas.subsidy_rate = 1.5; // Invalid
        assert!(config.validate().is_err());
    }
}

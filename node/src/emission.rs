use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};

/// IONX Token Emission System
/// Total Supply: 10,000,000,000 IONX (10 billion)
/// Emission Period: 20 years with 2-year halving
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmissionSchedule {
    /// Total maximum supply (10 billion IONX)
    pub max_supply: Decimal,
    
    /// Genesis allocation (pre-mined)
    pub genesis_allocation: Decimal,
    
    /// Initial block reward (79.35 IONX)
    pub initial_block_reward: Decimal,
    
    /// Halving interval in blocks (2 years = 63,072,000 blocks)
    pub halving_interval: u64,
    
    /// Number of halvings (10 total over 20 years)
    pub total_halvings: u32,
    
    /// Current circulating supply
    pub circulating_supply: Decimal,
    
    /// Total minted via block rewards
    pub total_minted: Decimal,
    
    /// Total burned (fees + slashing)
    pub total_burned: Decimal,
    
    /// Genesis block height
    pub genesis_height: u64,
}

impl Default for EmissionSchedule {
    fn default() -> Self {
        Self {
            max_supply: dec!(10_000_000_000),           // 10 billion
            genesis_allocation: dec!(2_100_000),        // 2.1M pre-mined
            initial_block_reward: dec!(79.35),          // Recalculated for 20 years
            halving_interval: 63_072_000,               // 2 years
            total_halvings: 10,                         // 20 years / 2
            circulating_supply: dec!(2_100_000),        // Starts with genesis
            total_minted: Decimal::ZERO,
            total_burned: Decimal::ZERO,
            genesis_height: 0,
        }
    }
}

impl EmissionSchedule {
    /// Create new emission schedule with custom genesis height
    pub fn new(genesis_height: u64) -> Self {
        Self {
            genesis_height,
            ..Default::default()
        }
    }
    
    /// Calculate block reward for a given block height
    /// Implements 2-year halving schedule
    pub fn calculate_block_reward(&self, block_height: u64) -> Decimal {
        let blocks_since_genesis = block_height.saturating_sub(self.genesis_height);
        let epoch = blocks_since_genesis / self.halving_interval;
        
        // Cap at maximum halvings
        let epoch = epoch.min(self.total_halvings as u64);
        
        // Reward halves each epoch: R / 2^epoch
        let divisor = Decimal::from(2u64.pow(epoch as u32));
        self.initial_block_reward / divisor
    }
    
    /// Get current epoch (0-14, where 0 is year 0-2, 14 is year 28-30)
    pub fn current_epoch(&self, block_height: u64) -> u32 {
        let blocks_since_genesis = block_height.saturating_sub(self.genesis_height);
        let epoch = blocks_since_genesis / self.halving_interval;
        epoch.min(self.total_halvings as u64) as u32
    }
    
    /// Calculate total IONX that will be minted in a given epoch
    pub fn epoch_total_emission(&self, epoch: u32) -> Decimal {
        if epoch >= self.total_halvings {
            return Decimal::ZERO;
        }
        
        let epoch_reward = self.initial_block_reward / Decimal::from(2u64.pow(epoch));
        let blocks_in_epoch = Decimal::from(self.halving_interval);
        
        epoch_reward * blocks_in_epoch
    }
    
    /// Calculate total IONX minted up to a given block height
    pub fn total_minted_at_height(&self, block_height: u64) -> Decimal {
        let blocks_since_genesis = block_height.saturating_sub(self.genesis_height);
        
        // Calculate complete epochs
        let complete_epochs = blocks_since_genesis / self.halving_interval;
        let remaining_blocks = blocks_since_genesis % self.halving_interval;
        
        // Sum all complete epochs
        let mut total = Decimal::ZERO;
        for epoch in 0..complete_epochs.min(self.total_halvings as u64) {
            total += self.epoch_total_emission(epoch as u32);
        }
        
        // Add partial epoch
        if complete_epochs < self.total_halvings as u64 {
            let current_reward = self.calculate_block_reward(block_height);
            total += current_reward * Decimal::from(remaining_blocks);
        }
        
        total
    }
    
    /// Mint new IONX for a block (updates circulating supply)
    pub fn mint_block_reward(&mut self, block_height: u64) -> Decimal {
        let reward = self.calculate_block_reward(block_height);
        
        // Check if we've hit max supply
        if self.circulating_supply + reward > self.max_supply {
            let remaining = self.max_supply - self.circulating_supply;
            self.circulating_supply = self.max_supply;
            self.total_minted += remaining;
            return remaining;
        }
        
        self.circulating_supply += reward;
        self.total_minted += reward;
        reward
    }
    
    /// Burn IONX (from fees or slashing)
    pub fn burn(&mut self, amount: Decimal) {
        self.circulating_supply = self.circulating_supply.saturating_sub(amount);
        self.total_burned += amount;
    }
    
    /// Get remaining supply to be minted
    pub fn remaining_supply(&self) -> Decimal {
        self.max_supply - self.circulating_supply
    }
    
    /// Check if emission is complete
    pub fn is_emission_complete(&self) -> bool {
        self.circulating_supply >= self.max_supply
    }
    
    /// Get inflation rate for current epoch (annual %)
    pub fn current_inflation_rate(&self, block_height: u64) -> Decimal {
        if self.circulating_supply.is_zero() {
            return Decimal::ZERO;
        }
        
        let annual_emission = self.calculate_block_reward(block_height) 
            * dec!(86400)  // blocks per day
            * dec!(365);   // days per year
        
        (annual_emission / self.circulating_supply) * dec!(100)
    }
    
    /// Get emission statistics
    pub fn get_stats(&self, block_height: u64) -> EmissionStats {
        EmissionStats {
            max_supply: self.max_supply,
            circulating_supply: self.circulating_supply,
            total_minted: self.total_minted,
            total_burned: self.total_burned,
            remaining_supply: self.remaining_supply(),
            current_epoch: self.current_epoch(block_height),
            current_block_reward: self.calculate_block_reward(block_height),
            inflation_rate: self.current_inflation_rate(block_height),
            emission_complete: self.is_emission_complete(),
        }
    }
}

/// Emission statistics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmissionStats {
    pub max_supply: Decimal,
    pub circulating_supply: Decimal,
    pub total_minted: Decimal,
    pub total_burned: Decimal,
    pub remaining_supply: Decimal,
    pub current_epoch: u32,
    pub current_block_reward: Decimal,
    pub inflation_rate: Decimal,
    pub emission_complete: bool,
}

/// Genesis allocation breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisAllocation {
    /// Node operators (sequencer setup, initial validators)
    pub node_operators: Decimal,
    
    /// Reserved (emergency fund, initial liquidity)
    pub reserved: Decimal,
}

impl Default for GenesisAllocation {
    fn default() -> Self {
        Self {
            node_operators: dec!(2_000_000),  // 2M IONX
            reserved: dec!(100_000),          // 100k IONX
        }
    }
}

impl GenesisAllocation {
    pub fn total(&self) -> Decimal {
        self.node_operators + self.reserved
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emission_schedule() {
        let emission = EmissionSchedule::default();
        
        // Test initial values
        assert_eq!(emission.max_supply, dec!(10_000_000_000));
        assert_eq!(emission.genesis_allocation, dec!(2_100_000));
        assert_eq!(emission.initial_block_reward, dec!(79.35));
        assert_eq!(emission.total_halvings, 10); // 20 years
    }

    #[test]
    fn test_block_reward_halving() {
        let emission = EmissionSchedule::new(0);
        
        // Epoch 0 (Year 0-2): 79.35 IONX
        assert_eq!(emission.calculate_block_reward(0), dec!(79.35));
        assert_eq!(emission.calculate_block_reward(1_000_000), dec!(79.35));
        
        // Epoch 1 (Year 2-4): 39.675 IONX
        assert_eq!(emission.calculate_block_reward(63_072_000), dec!(39.675));
        
        // Epoch 2 (Year 4-6): 19.8375 IONX
        assert_eq!(emission.calculate_block_reward(63_072_000 * 2), dec!(19.8375));
        
        // Epoch 3 (Year 6-8): 9.91875 IONX
        assert_eq!(emission.calculate_block_reward(63_072_000 * 3), dec!(9.91875));
    }

    #[test]
    fn test_epoch_calculation() {
        let emission = EmissionSchedule::new(0);
        
        assert_eq!(emission.current_epoch(0), 0);
        assert_eq!(emission.current_epoch(63_072_000), 1);
        assert_eq!(emission.current_epoch(63_072_000 * 2), 2);
        assert_eq!(emission.current_epoch(63_072_000 * 9), 9);
        assert_eq!(emission.current_epoch(63_072_000 * 15), 9); // Capped at 9 (10 halvings = epochs 0-9)
    }

    #[test]
    fn test_epoch_total_emission() {
        let emission = EmissionSchedule::new(0);
        
        // Epoch 0: 79.35 × 63,072,000 = 5,006,862,000 IONX
        let epoch0 = emission.epoch_total_emission(0);
        assert_eq!(epoch0, dec!(79.35) * dec!(63_072_000));
        
        // Epoch 1: 39.675 × 63,072,000 = 2,503,431,000 IONX
        let epoch1 = emission.epoch_total_emission(1);
        assert_eq!(epoch1, dec!(39.675) * dec!(63_072_000));
        
        // Each epoch is half of previous
        assert_eq!(epoch1, epoch0 / dec!(2));
    }

    #[test]
    fn test_total_minted_calculation() {
        let emission = EmissionSchedule::new(0);
        
        // After 1 complete epoch
        let minted_epoch1 = emission.total_minted_at_height(63_072_000);
        assert_eq!(minted_epoch1, dec!(79.3) * dec!(63_072_000));
        
        // After 2 complete epochs
        let minted_epoch2 = emission.total_minted_at_height(63_072_000 * 2);
        let expected = (dec!(79.3) + dec!(39.65)) * dec!(63_072_000);
        assert_eq!(minted_epoch2, expected);
    }

    #[test]
    fn test_mint_and_burn() {
        let mut emission = EmissionSchedule::new(0);
        
        // Initial circulating supply is genesis allocation
        assert_eq!(emission.circulating_supply, dec!(2_100_000));
        
        // Mint first block reward
        let reward = emission.mint_block_reward(0);
        assert_eq!(reward, dec!(79.3));
        assert_eq!(emission.circulating_supply, dec!(2_100_000) + dec!(79.3));
        assert_eq!(emission.total_minted, dec!(79.3));
        
        // Burn some tokens
        emission.burn(dec!(10));
        assert_eq!(emission.circulating_supply, dec!(2_100_000) + dec!(79.3) - dec!(10));
        assert_eq!(emission.total_burned, dec!(10));
    }

    #[test]
    fn test_max_supply_cap() {
        let mut emission = EmissionSchedule::new(0);
        
        // Set circulating supply close to max
        emission.circulating_supply = dec!(9_999_999_950);
        
        // Try to mint more than remaining
        let reward = emission.mint_block_reward(0);
        
        // Should only mint remaining amount
        assert_eq!(reward, dec!(50));
        assert_eq!(emission.circulating_supply, dec!(10_000_000_000));
        assert!(emission.is_emission_complete());
    }

    #[test]
    fn test_inflation_rate() {
        let mut emission = EmissionSchedule::new(0);
        emission.circulating_supply = dec!(1_000_000_000); // 1B IONX
        
        // Year 1 inflation with 79.3 IONX/block
        // Annual emission = 79.3 × 86,400 × 365 = 2,502,552,000 IONX
        // Inflation rate = (2,502,552,000 / 1,000,000,000) × 100 = 250.26%
        let inflation = emission.current_inflation_rate(0);
        
        // Should be around 250%
        assert!(inflation > dec!(250) && inflation < dec!(251));
    }

    #[test]
    fn test_20_year_emission() {
        let emission = EmissionSchedule::new(0);
        
        // Calculate total emission over 20 years (10 epochs)
        let mut total = Decimal::ZERO;
        for epoch in 0..10 {
            total += emission.epoch_total_emission(epoch);
        }
        
        // Should be close to 10B - genesis allocation
        let expected = dec!(10_000_000_000) - dec!(2_100_000);
        
        // Allow small rounding difference
        let diff = (total - expected).abs();
        assert!(diff < dec!(1_000_000)); // Within 1M IONX
    }

    #[test]
    fn test_genesis_allocation() {
        let genesis = GenesisAllocation::default();
        
        assert_eq!(genesis.node_operators, dec!(2_000_000));
        assert_eq!(genesis.reserved, dec!(100_000));
        assert_eq!(genesis.total(), dec!(2_100_000));
    }
}

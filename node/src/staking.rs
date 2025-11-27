use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Block reward configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockRewardConfig {
    /// Initial block reward (halves every 2 years)
    pub initial_reward: Decimal,
    
    /// Halving interval in blocks (2 years ≈ 63M blocks)
    pub halving_interval: u64,
    
    /// Distribution percentages
    pub validator_share: Decimal,    // 0.70 (70%)
    pub sequencer_share: Decimal,    // 0.20 (20%)
    pub treasury_share: Decimal,     // 0.10 (10%)
}

impl Default for BlockRewardConfig {
    fn default() -> Self {
        Self {
            initial_reward: dec!(79.3),
            halving_interval: 63_072_000, // 2 years at 1s blocks
            validator_share: dec!(0.70),
            sequencer_share: dec!(0.20),
            treasury_share: dec!(0.10),
        }
    }
}

/// Validator stake information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorStake {
    pub operator: String,
    pub self_stake: Decimal,
    pub delegated_stake: Decimal,
    pub commission_rate: Decimal, // 0.05 = 5%
    pub delegators: HashMap<String, Decimal>,
}

impl ValidatorStake {
    pub fn total_stake(&self) -> Decimal {
        self.self_stake + self.delegated_stake
    }
}

/// Staking rewards distributor
pub struct StakingRewards {
    config: BlockRewardConfig,
    validators: HashMap<String, ValidatorStake>,
    treasury_balance: Decimal,
    genesis_height: u64,
}

impl StakingRewards {
    pub fn new(config: BlockRewardConfig, genesis_height: u64) -> Self {
        Self {
            config,
            validators: HashMap::new(),
            treasury_balance: Decimal::ZERO,
            genesis_height,
        }
    }

    /// Calculate current block reward based on height (with halving)
    pub fn calculate_block_reward(&self, block_height: u64) -> Decimal {
        let blocks_since_genesis = block_height.saturating_sub(self.genesis_height);
        let halvings = blocks_since_genesis / self.config.halving_interval;
        
        // Reward halves every interval
        let divisor = Decimal::from(2u64.pow(halvings as u32));
        self.config.initial_reward / divisor
    }

    /// Distribute block reward to validators, sequencers, and treasury
    pub fn distribute_block_reward(
        &mut self,
        block_height: u64,
        active_sequencers: &[String],
    ) -> BlockRewardDistribution {
        let total_reward = self.calculate_block_reward(block_height);

        // Split reward
        let validator_pool = total_reward * self.config.validator_share;
        let sequencer_pool = total_reward * self.config.sequencer_share;
        let treasury_amount = total_reward * self.config.treasury_share;

        // Distribute to validators by stake weight
        let total_stake = self.total_network_stake();
        let mut validator_rewards = HashMap::new();

        for (address, validator) in &self.validators {
            let stake_fraction = validator.total_stake() / total_stake;
            let validator_reward = validator_pool * stake_fraction;
            
            // Apply commission for delegators
            let (operator_reward, delegator_pool) = 
                self.apply_commission(validator, validator_reward);

            validator_rewards.insert(address.clone(), ValidatorReward {
                operator_reward,
                delegator_rewards: self.distribute_to_delegators(
                    validator,
                    delegator_pool,
                ),
            });
        }

        // Distribute to sequencers equally
        let sequencer_reward = if !active_sequencers.is_empty() {
            sequencer_pool / Decimal::from(active_sequencers.len())
        } else {
            Decimal::ZERO
        };

        let mut sequencer_rewards = HashMap::new();
        for sequencer in active_sequencers {
            sequencer_rewards.insert(sequencer.clone(), sequencer_reward);
        }

        // Add to treasury
        self.treasury_balance += treasury_amount;

        BlockRewardDistribution {
            total_reward,
            validator_rewards,
            sequencer_rewards,
            treasury_amount,
        }
    }

    /// Apply validator commission and split operator vs delegator rewards
    fn apply_commission(
        &self,
        validator: &ValidatorStake,
        total_reward: Decimal,
    ) -> (Decimal, Decimal) {
        // Calculate operator's share from self-stake
        let stake_fraction = validator.self_stake / validator.total_stake();
        let operator_base = total_reward * stake_fraction;

        // Calculate delegator pool
        let delegator_base = total_reward - operator_base;

        // Apply commission on delegator rewards
        let commission = delegator_base * validator.commission_rate;
        let delegator_pool = delegator_base - commission;

        let operator_total = operator_base + commission;

        (operator_total, delegator_pool)
    }

    /// Distribute rewards to individual delegators
    fn distribute_to_delegators(
        &self,
        validator: &ValidatorStake,
        delegator_pool: Decimal,
    ) -> HashMap<String, Decimal> {
        let mut rewards = HashMap::new();

        for (delegator, stake) in &validator.delegators {
            let fraction = *stake / validator.delegated_stake;
            let reward = delegator_pool * fraction;
            rewards.insert(delegator.clone(), reward);
        }

        rewards
    }

    /// Get total staked across all validators
    fn total_network_stake(&self) -> Decimal {
        self.validators
            .values()
            .map(|v| v.total_stake())
            .sum()
    }

    /// Add a validator
    pub fn add_validator(&mut self, validator: ValidatorStake) {
        self.validators.insert(validator.operator.clone(), validator);
    }

    /// Delegate stake to a validator
    pub fn delegate(
        &mut self,
        validator_address: &str,
        delegator: String,
        amount: Decimal,
    ) -> Result<(), String> {
        let validator = self.validators
            .get_mut(validator_address)
            .ok_or("Validator not found")?;

        *validator.delegators.entry(delegator).or_insert(Decimal::ZERO) += amount;
        validator.delegated_stake += amount;

        Ok(())
    }
}

/// Result of block reward distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockRewardDistribution {
    pub total_reward: Decimal,
    pub validator_rewards: HashMap<String, ValidatorReward>,
    pub sequencer_rewards: HashMap<String, Decimal>,
    pub treasury_amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorReward {
    pub operator_reward: Decimal,
    pub delegator_rewards: HashMap<String, Decimal>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_reward_halving() {
        let config = BlockRewardConfig::default();
        let staking = StakingRewards::new(config, 0);

        // Initial reward
        assert_eq!(staking.calculate_block_reward(0), dec!(79.3));

        // After 1 halving (2 years)
        assert_eq!(
            staking.calculate_block_reward(63_072_000),
            dec!(39.65)
        );

        // After 2 halvings (4 years)
        assert_eq!(
            staking.calculate_block_reward(63_072_000 * 2),
            dec!(19.825)
        );
    }

    #[test]
    fn test_commission_calculation() {
        let validator = ValidatorStake {
            operator: "val1".to_string(),
            self_stake: dec!(100000),      // 100k self
            delegated_stake: dec!(900000), // 900k delegated
            commission_rate: dec!(0.10),   // 10%
            delegators: HashMap::new(),
        };

        let staking = StakingRewards::new(BlockRewardConfig::default(), 0);
        
        // Total reward: 79.3 IONX
        let (operator_reward, delegator_pool) = 
            staking.apply_commission(&validator, dec!(79.3));

        // Operator gets: (100k/1M × 79.3) + (900k/1M × 79.3 × 0.10)
        //              = 7.93 + 7.137 = 15.067 IONX
        assert_eq!(operator_reward, dec!(15.067));

        // Delegators get: (900k/1M × 79.3) × 0.90 = 64.233 IONX
        assert_eq!(delegator_pool, dec!(64.233));
    }

    #[test]
    fn test_staking_apr() {
        // With 79.3 IONX/block, 86400 blocks/day
        // 2-year rewards = 79.3 × 86,400 × 730 = 5,004M IONX (first epoch)
        // After 30 years, total ≈ 10B IONX

        let total_over_30_years = dec!(79.3) * dec!(86400) * dec!(365) * dec!(30);
        // This equals approximately 10B with the halving formula
        
        // If 1B IONX staked initially, Year 1-2 APR:
        let annual_rewards_year1 = dec!(79.3) * dec!(86400) * dec!(365);
        let total_staked = dec!(100_000_000); // 100M for test
        let apr = annual_rewards_year1 / total_staked;

        // APR = 2.5B / 100M = 25x = 2500%
        // With proper delegation across all validators, APR normalizes
    }
}

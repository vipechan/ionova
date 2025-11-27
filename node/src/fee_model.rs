use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};

/// Fee model configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeConfig {
    /// Fixed base fee per transaction (anti-spam)
    pub base_tx_fee: Decimal,
    /// Per-gas base fee (dynamic, EIP-1559 style)
    pub base_fee_per_gas: Decimal,
    /// Target gas utilization (0.8 = 80%)
    pub target_utilization: Decimal,
    /// Adjustment factor for dynamic fee (e.g., 0.125 = 12.5%)
    pub adjustment_factor: Decimal,
}

impl Default for FeeConfig {
    fn default() -> Self {
        Self {
            base_tx_fee: dec!(0.0001),
            base_fee_per_gas: dec!(0.000001),
            target_utilization: dec!(0.8),
            adjustment_factor: dec!(0.125),
        }
    }
}

/// Transaction fee breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionFee {
    /// Fixed base fee component
    pub base_fee: Decimal,
    /// Gas-based fee component
    pub gas_fee: Decimal,
    /// Priority tip (goes to sequencer)
    pub tip: Decimal,
    /// Total fee
    pub total: Decimal,
}

impl TransactionFee {
    pub fn calculate(config: &FeeConfig, gas_used: u64, tip: Decimal) -> Self {
        let base_fee = config.base_tx_fee;
        let gas_fee = config.base_fee_per_gas * Decimal::from(gas_used);
        let total = base_fee + gas_fee + tip;

        Self {
            base_fee,
            gas_fee,
            tip,
            total,
        }
    }
}

/// Dynamic fee adjustment based on block utilization
pub fn adjust_base_fee(
    current_base_fee: Decimal,
    gas_used: u64,
    gas_target: u64,
    adjustment_factor: Decimal,
) -> Decimal {
    let utilization = Decimal::from(gas_used) / Decimal::from(gas_target);
    
    if utilization > dec!(1.0) {
        // Over target, increase fee
        let increase = current_base_fee * adjustment_factor;
        current_base_fee + increase
    } else if utilization < dec!(1.0) {
        // Under target, decrease fee
        let decrease = current_base_fee * adjustment_factor;
        let new_fee = current_base_fee - decrease;
        // Ensure fee doesn't go below minimum
        new_fee.max(dec!(0.000001))
    } else {
        current_base_fee
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fee_calculation() {
        let config = FeeConfig::default();
        let fee = TransactionFee::calculate(&config, 5000, dec!(0.0));
        
        // base_tx_fee = 0.0001
        // gas_fee = 5000 * 0.000001 = 0.005
        // total = 0.0001 + 0.005 + 0 = 0.0051
        assert_eq!(fee.total, dec!(0.0051));
    }

    #[test]
    fn test_fee_adjustment_over_target() {
        let current = dec!(0.000001);
        let new_fee = adjust_base_fee(current, 25_000_000, 20_000_000, dec!(0.125));
        
        // Over target by 25%, should increase by 12.5%
        assert!(new_fee > current);
    }

    #[test]
    fn test_fee_adjustment_under_target() {
        let current = dec!(0.000001);
        let new_fee = adjust_base_fee(current, 15_000_000, 20_000_000, dec!(0.125));
        
        // Under target, should decrease but not below minimum
        assert!(new_fee <= current);
        assert!(new_fee >= dec!(0.000001));
    }
}

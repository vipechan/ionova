use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Price oracle interface for dynamic fee scaling
pub trait PriceOracle {
    fn get_ionx_price_usd(&self) -> Decimal;
    fn is_healthy(&self) -> bool;
}

/// Dynamic fee scaler based on IONX price
pub struct DynamicFeeScaler {
    target_fee_usd: Decimal,
    base_ionx_price: Decimal, // Baseline price (e.g., $1)
    min_scale_factor: Decimal, // Don't scale below this (e.g., 0.00001)
    max_scale_factor: Decimal, // Don't scale above this (e.g., 100)
    last_known_price: Decimal,
}

impl Default for DynamicFeeScaler {
    fn default() -> Self {
        Self {
            target_fee_usd: Decimal::new(5, 3), // $0.005
            base_ionx_price: Decimal::new(1, 0), // $1
            min_scale_factor: Decimal::new(1, 5), // 0.00001
            max_scale_factor: Decimal::new(100, 0), // 100
            last_known_price: Decimal::new(1, 0), // $1
        }
    }
}

impl DynamicFeeScaler {
    /// Calculate scaling factor based on current IONX price
    pub fn calculate_scale_factor(
        &mut self,
        oracle: &dyn PriceOracle,
    ) -> Decimal {
        let price = if oracle.is_healthy() {
            let current_price = oracle.get_ionx_price_usd();
            self.last_known_price = current_price;
            current_price
        } else {
            // Oracle failure: use last known price
            self.last_known_price
        };

        let scale_factor = self.base_ionx_price / price;
        
        // Clamp to min/max bounds
        scale_factor.max(self.min_scale_factor).min(self.max_scale_factor)
    }

    /// Get adjusted base_tx_fee for current price
    pub fn get_adjusted_base_tx_fee(
        &mut self,
        base_value: Decimal,
        oracle: &dyn PriceOracle,
    ) -> Decimal {
        let scale = self.calculate_scale_factor(oracle);
        base_value * scale
    }

    /// Get adjusted base_fee_per_gas for current price
    pub fn get_adjusted_base_fee_per_gas(
        &mut self,
        base_value: Decimal,
        oracle: &dyn PriceOracle,
    ) -> Decimal {
        let scale = self.calculate_scale_factor(oracle);
        base_value * scale
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    struct MockOracle {
        price: Decimal,
        healthy: bool,
    }

    impl PriceOracle for MockOracle {
        fn get_ionx_price_usd(&self) -> Decimal {
            self.price
        }

        fn is_healthy(&self) -> bool {
            self.healthy
        }
    }

    #[test]
    fn test_scale_factor_at_100k() {
        let mut scaler = DynamicFeeScaler::default();
        let oracle = MockOracle {
            price: dec!(100000.0),
            healthy: true,
        };

        let scale = scaler.calculate_scale_factor(&oracle);
        // $1 / $100,000 = 0.00001
        assert_eq!(scale, dec!(0.00001));
    }

    #[test]
    fn test_adjusted_fee_at_100k() {
        let mut scaler = DynamicFeeScaler::default();
        let oracle = MockOracle {
            price: dec!(100000.0),
            healthy: true,
        };

        // Original base_tx_fee = 0.0001
        let adjusted_base = scaler.get_adjusted_base_tx_fee(dec!(0.0001), &oracle);
        // 0.0001 × 0.00001 = 0.000000001
        assert_eq!(adjusted_base, dec!(0.000000001));

        // Original base_fee_per_gas = 0.000001
        let adjusted_gas = scaler.get_adjusted_base_fee_per_gas(dec!(0.000001), &oracle);
        // 0.000001 × 0.00001 = 0.00000000001
        assert_eq!(adjusted_gas, dec!(0.00000000001));
    }

    #[test]
    fn test_oracle_failure_fallback() {
        let mut scaler = DynamicFeeScaler::default();
        
        // First, healthy oracle at $100
        let oracle_healthy = MockOracle {
            price: dec!(100.0),
            healthy: true,
        };
        let scale1 = scaler.calculate_scale_factor(&oracle_healthy);
        assert_eq!(scale1, dec!(0.01));

        // Now oracle fails
        let oracle_failed = MockOracle {
            price: dec!(1000.0), // Should be ignored
            healthy: false,
        };
        let scale2 = scaler.calculate_scale_factor(&oracle_failed);
        // Should use last known price ($100)
        assert_eq!(scale2, dec!(0.01));
    }
}

#[cfg(test)]
mod crypto_tests {
    use crate::crypto::*;
    
    #[test]
    fn test_ecdsa_signature_creation() {
        // Test ECDSA signature
        let sig = Signature::ECDSA {
            r: [0xFF; 32],
            s: [0xEE; 32],
            v: 27,
        };
        
        assert_eq!(sig.algorithm(), SignatureAlgorithm::ECDSA);
        assert_eq!(sig.size(), 65);
    }
    
    #[test]
    fn test_dilithium_signature_size() {
        let sig = Signature::Dilithium {
            data: vec![0xAA; 2420],
        };
        
        assert_eq!(sig.algorithm(), SignatureAlgorithm::Dilithium);
        assert_eq!(sig.size(), 2420);
    }
    
    #[test]
    fn test_hybrid_signature() {
        let hybrid = Signature::Hybrid {
            ecdsa: Box::new(Signature::ECDSA {
                r: [0xFF; 32],
                s: [0xEE; 32],
                v: 27,
            }),
            pq: Box::new(Signature::Dilithium {
                data: vec![0xAA; 2420],
            }),
        };
        
        assert_eq!(hybrid.algorithm(), SignatureAlgorithm::Hybrid);
        assert_eq!(hybrid.size(), 65 + 2420); // Combined size
    }
    
    #[test]
    fn test_address_derivation() {
        let pubkey = PublicKeyData::ECDSA {
            bytes: [0x04; 33], // Compressed public key
        };
        
        let addr = pubkey.to_address();
        
        match addr {
            Address::EVM(bytes) => {
                assert_eq!(bytes.len(), 20);
            }
            _ => panic!("Expected EVM address"),
        }
    }
}

#[cfg(test)]
mod transaction_tests {
    use crate::crypto::*;
    use crate::transaction::*;
    use rust_decimal_macros::dec;
    
    #[test]
    fn test_transaction_builder() {
        let tx = TransactionBuilder::new()
            .nonce(1)
            .from(Address::EVM([0x12; 20]))
            .to(Address::EVM([0x34; 20]))
            .value(dec!(100)).unwrap()
            .gas_limit(25_000)
            .gas_price(dec!(0.000001))
            .build(
                Signature::ECDSA {
                    r: [0xFF; 32],
                    s: [0xEE; 32],
                    v: 27,
                },
                PublicKeyData::ECDSA { bytes: [0x04; 33] },
            )
            .unwrap();
        
            from: Address::EVM([0; 20]),
            to: Address::EVM([1; 20]),
            value: dec!(200),
            gas_limit: 50_000,
            gas_price: dec!(0.000001),
            data: vec![],
            signature: Signature::Dilithium { data: vec![0; 2420] },
            public_key: PublicKeyData::Dilithium { bytes: vec![0; 2528] },
            expiry: None,
        };
        
        // 21k base + 25k subsidized (50k / 2)
        assert_eq!(tx.calculate_gas_cost().unwrap(), 46_000);
    }
    
    #[test]
    fn test_transaction_fee_calculation() {
        let tx = Transaction {
            nonce: 1,
            from: Address::EVM([0; 20]),
            to: Address::EVM([1; 20]),
            value: dec!(100),
            gas_limit: 24_000,
            gas_price: dec!(0.000001),
            data: vec![],
            signature: Signature::ECDSA {
                r: [0; 32],
                s: [0; 32],
                v: 0,
            },
            public_key: PublicKeyData::ECDSA { bytes: [0; 33] },
            expiry: None,
        };
        
        let fee = tx.calculate_fee().unwrap();
        assert_eq!(fee, dec!(0.024)); // 24,000 * 0.000001
    }
}

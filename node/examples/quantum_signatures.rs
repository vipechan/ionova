// Example: Using Post-Quantum Signatures in Ionova

use ionova_node::crypto::{Address, PublicKeyData, Signature, SignatureAlgorithm};
use ionova_node::transaction::{Transaction, TransactionBuilder};
use rust_decimal_macros::dec;

fn main() {
    println!("=== Ionova Post-Quantum Signature Examples ===\n");

    // Example 1: ECDSA Transaction (Traditional)
    println!("1. ECDSA Transaction (MetaMask Compatible)");
    let ecdsa_tx = create_ecdsa_transaction();
    print_transaction_info(&ecdsa_tx);

    // Example 2: Dilithium Transaction (Quantum-Safe)
    println!("\n2. Dilithium Transaction (Quantum-Safe)");
    let dilithium_tx = create_dilithium_transaction();
    print_transaction_info(&dilithium_tx);

    // Example 3: Hybrid Transaction (Maximum Security)
    println!("\n3. Hybrid Transaction (Transition Period)");
    let hybrid_tx = create_hybrid_transaction();
    print_transaction_info(&hybrid_tx);

    // Example 4: Gas Cost Comparison
    println!("\n4. Gas Cost Comparison");
    compare_gas_costs();
}

fn create_ecdsa_transaction() -> Transaction {
    TransactionBuilder::new()
        .nonce(1)
        .from(Address::EVM([0x12; 20]))
        .to(Address::EVM([0x34; 20]))
        .value(dec!(100))
        .gas_limit(25_000)
        .gas_price(dec!(0.000001))
        .build(
            Signature::ECDSA {
                r: [0xff; 32],
                s: [0xee; 32],
                v: 27,
            },
            PublicKeyData::ECDSA {
                bytes: [0xab; 33],
            },
        )
        .expect("Failed to create ECDSA transaction")
}

fn create_dilithium_transaction() -> Transaction {
    TransactionBuilder::new()
        .nonce(2)
        .from(Address::EVM([0x56; 20]))
        .to(Address::EVM([0x78; 20]))
        .value(dec!(200))
        .gas_limit(50_000)
        .gas_price(dec!(0.000001))
        .build(
            Signature::Dilithium {
                data: vec![0xaa; 2420], // 2,420 bytes
            },
            PublicKeyData::Dilithium {
                bytes: vec![0xbb; 2528], // 2,528 bytes
            },
        )
        .expect("Failed to create Dilithium transaction")
}

fn create_hybrid_transaction() -> Transaction {
    TransactionBuilder::new()
        .nonce(3)
        .from(Address::EVM([0x9a; 20]))
        .to(Address::EVM([0xbc; 20]))
        .value(dec!(300))
        .gas_limit(75_000)
        .gas_price(dec!(0.000001))
        .build(
            Signature::Hybrid {
                ecdsa: Box::new(Signature::ECDSA {
                    r: [0xcc; 32],
                    s: [0xdd; 32],
                    v: 28,
                }),
                pq: Box::new(Signature::Dilithium {
                    data: vec![0xee; 2420],
                }),
            },
            PublicKeyData::Hybrid {
                ecdsa: Box::new(PublicKeyData::ECDSA {
                    bytes: [0xff; 33],
                }),
                pq: Box::new(PublicKeyData::Dilithium {
                    bytes: vec![0x11; 2528],
                }),
            },
        )
        .expect("Failed to create hybrid transaction")
}

fn print_transaction_info(tx: &Transaction) {
    let gas_cost = tx.calculate_gas_cost();
    let fee = tx.calculate_fee();
    let sig_size = tx.signature.size();

    println!("   Nonce: {}", tx.nonce);
    println!("   Value: {} IONX", tx.value);
    println!("   Signature Type: {:?}", tx.signature.algorithm());
    println!("   Signature Size: {} bytes", sig_size);
    println!("   Gas Cost: {} gas", gas_cost);
    println!("   Transaction Fee: {} IONX", fee);
}

fn compare_gas_costs() {
    let algorithms = vec![
        ("ECDSA", SignatureAlgorithm::ECDSA, 65),
        ("Dilithium", SignatureAlgorithm::Dilithium, 2420),
        ("SPHINCS+", SignatureAlgorithm::SPHINCSPlus, 2048),
        ("Falcon", SignatureAlgorithm::Falcon, 1280),
    ];

    println!("┌─────────────┬──────────────┬───────────┬──────────────┬─────────┐");
    println!("│ Algorithm   │ Sig Size (B) │ Gas Cost  │ Fee (IONX)   │ Savings │");
    println!("├─────────────┼──────────────┼───────────┼──────────────┼─────────┤");

    for (name, algo, size) in algorithms {
        let gas_cost = match algo {
            SignatureAlgorithm::ECDSA => 24_000,
            SignatureAlgorithm::Dilithium => 46_000,
            SignatureAlgorithm::SPHINCSPlus => 55_500,
            SignatureAlgorithm::Falcon => 38_500,
            _ => 0,
        };

        let fee = gas_cost as f64 * 0.000001;
        let savings = if algo == SignatureAlgorithm::ECDSA {
            0.0
        } else {
            let ecdsa_cost = 24_000;
            ((gas_cost as f64 - ecdsa_cost as f64) / gas_cost as f64 * 100.0).abs()
        };

        println!(
            "│ {:<11} │ {:>12} │ {:>9} │ {:>12.6} │ {:>6.1}% │",
            name, size, gas_cost, fee, savings
        );
    }

    println!("└─────────────┴──────────────┴───────────┴──────────────┴─────────┘");
    println!("\n   Note: PQ signatures have 50% gas subsidy during migration period");
    println!("   Actual cost: Dilithium=71k, SPHINCS+=91k, Falcon=56k gas");
}

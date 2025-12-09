# Ionova Rust SDK

Official Rust SDK for Ionova blockchain with quantum-safe signature support.

## Features

- ✅ **4 Signature Types**
  - ECDSA (traditional)
  - Dilithium (quantum-safe, recommended)
  - SPHINCS+ (ultra-secure)
  - Hybrid (ECDSA + PQ)

- ✅ **Full Wallet Operations**
  - Create wallets
  - Sign transactions
  - Send transactions
  - Query balances
  - Estimate gas

- ✅ **Production Ready**
  - Async/await support (Tokio)
  - Error handling (anyhow)
  - Type-safe API
  - Reuses battle-tested node crypto

## Installation

```toml
[dependencies]
ionova-sdk = "1.0"
tokio = { version = "1", features = ["full"] }
```

## Quick Start

```rust
use ionova_sdk::{IonovaWallet, RpcClient, dec};
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // Connect to Ionova
    let client = RpcClient::new("http://localhost:27000".to_string());
    
    // Create quantum-safe wallet
    let wallet = IonovaWallet::create_dilithium()?;
    
    // Send transaction
    let tx_hash = wallet.send_transaction(
        &client,
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".parse()?,
        dec!(100),  // 100 IONX
    ).await?;
    
    println!("Transaction sent: {}", tx_hash);
    Ok(())
}
```

## Examples

### Create Different Wallet Types

```rust
// ECDSA (traditional)
let wallet = IonovaWallet::create_ecdsa()?;

// Dilithium (recommended for quantum safety)
let wallet = IonovaWallet::create_dilithium()?;

// SPHINCS+ (maximum security)
let wallet = IonovaWallet::create_sphincs()?;

// Hybrid (ECDSA + Dilithium)
let wallet = IonovaWallet::create_hybrid()?;
```

### Check Balance

```rust
let balance = client.get_balance(&wallet.address()).await?;
println!("Balance: {} IONX", balance);
```

### Send Transaction

```rust
let tx_hash = wallet.send_transaction(
    &client,
    to_address,
    dec!(50),  // amount
).await?;
```

## Architecture

This SDK reuses the core cryptography from Ionova node's `crypto.rs`, ensuring:
- Same security guarantees
- Consistent behavior
- Easy maintenance
- Battle-tested code

## Testing

```bash
cargo test
```

## Examples

```bash
cargo run --example send_transaction
```

## Documentation

```bash
cargo doc --open
```

## License

MIT

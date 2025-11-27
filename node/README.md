# Ionova Node Starter Kit

This directory contains the Rust implementation of the Ionova blockchain node.

## Components

- **`fee_model.rs`**: EIP-1559-style dynamic fee calculation
- **`mempool.rs`**: Transaction mempool with rate limiting and min fee enforcement
- **`sequencer.rs`**: Batch production and commitment generation
- **`metrics.rs`**: Prometheus metrics for monitoring
- **`main.rs`**: CLI entry point for validator and sequencer modes

## Binaries

### Node (Validator or Sequencer)

```bash
# Run as validator
cargo run --bin ionova_node validator --id 0

# Run as sequencer for shard 0
cargo run --bin ionova_node sequencer --shard-id 0 --metrics-port 9100
```

### Load Generator

```bash
# Test 8 shards at 5k TPS each
cargo run --release --bin load_generator -- \
  --shards 8 \
  --tps-per-shard 5000 \
  --duration 60 \
  --workers 100
```

## Mempool Features

The mempool enforces:
- **Minimum fee**: Default 0.0051 IONX (configurable)
- **Rate limiting**: 100 tx/sec per account (configurable)
- **Capacity**: Max 10,000 pending transactions
- **Fee validation**: Rejects transactions below minimum

## Gas & Fees

**Fee formula:**
```
total_fee = base_tx_fee + (gas_used × base_fee_per_gas) + tip
```

**Default values:**
- `base_tx_fee` = 0.0001 IONX
- `base_fee_per_gas` = 0.000001 IONX
- Average transaction (5,000 gas) = **0.0051 IONX**

## Building

```bash
# Check for compile errors
cargo check --all

# Build release binaries
cargo build --release

# Run tests
cargo test
```

## Docker

See [`../devnet/`](file:///f:/ionova/devnet) for Docker deployment.

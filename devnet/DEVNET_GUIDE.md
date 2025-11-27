# Ionova Devnet Guide

## Overview

This devnet runs **8 shards** targeting **40,000 TPS total** (5,000 TPS per shard) to validate the Ionova architecture for scaling to 500k+ TPS.

## Architecture

- **3 Validators**: Base layer consensus using PQ-BFT
- **8 Sequencers**: One per shard, batching transactions and producing commitments
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

## Fee Model

- `base_tx_fee`: 0.0001 IONX (anti-spam)
- `base_fee_per_gas`: 0.000001 IONX (dynamic, EIP-1559 style)
- **Average transaction fee**: ~0.0051 IONX (for 5,000 gas tx)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Rust (for load generator)

### 1. Start the Devnet

```bash
cd devnet
docker-compose up -d
```

This will start:
- 3 validators (ports 26656-26677)
- 8 sequencers (ports 27000-27700)
- Prometheus (port 9090)
- Grafana (port 3000)

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific shard
docker-compose logs -f sequencer-0

# Validators
docker-compose logs -f validator-0
```

### 3. Access Monitoring

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Shard metrics**: http://localhost:9100-9107/metrics

### 4. Run Load Generator

Build and run the load generator:

```bash
cd ../node
cargo build --release --bin load_generator

# Test all 8 shards at 5k TPS each = 40k total
cargo run --release --bin load_generator -- --shards 8 --tps-per-shard 5000 --duration 60

# Lighter test
cargo run --release --bin load_generator -- --shards 8 --tps-per-shard 1000 --duration 30
```

The load generator will output:
- Real-time progress every 5 seconds
- Final report with:
  - Total TPS achieved
  - Success rate
  - Latency statistics (p50, p95, p99)

## Expected Results

For a successful 40k TPS test:
- ✅ All 8 shards running
- ✅ ~5,000 TPS per shard sustained
- ✅ Average latency < 1s
- ✅ p99 latency < 3s
- ✅ Success rate > 99%

## Configuration Files

- [`genesis.json`](file:///f:/ionova/devnet/genesis.json) - Chain parameters and fee model
- [`shard_config.json`](file:///f:/ionova/devnet/shard_config.json) - Per-shard configuration
- [`docker-compose.yml`](file:///f:/ionova/devnet/docker-compose.yml) - Service orchestration
- [`prometheus.yml`](file:///f:/ionova/devnet/prometheus.yml) - Metrics scraping

## Scaling to Production

To scale from 8 shards (40k TPS) to 100 shards (500k TPS):

1. Update `genesis.json`: `shard_count: 100`
2. Add sequencer services in `docker-compose.yml`
3. Update `prometheus.yml` targets
4. Deploy on dedicated hardware (not Docker)

## Troubleshooting

### Port conflicts
If ports are in use, modify the port mappings in `docker-compose.yml`.

### Out of memory
Reduce worker count in load generator: `--workers 50`

### Slow performance
Ensure Docker has adequate resources allocated (CPU/RAM).

## Cleanup

```bash
docker-compose down -v
```

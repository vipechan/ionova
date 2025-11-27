# Ionova Node Types & Functions

## Overview

Ionova uses a **multi-tier node architecture** with different node types serving specific functions:

```
┌─────────────────────────────────────┐
│         User Applications           │
└───────────────┬─────────────────────┘
                │
        ┌───────┴────────┐
        │                │
    ┌───▼────┐      ┌───▼────┐
    │ Light  │      │  Full  │
    │ Client │      │  Node  │
    └────────┘      └───┬────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼────┐     ┌───▼────┐     ┌───▼────┐
    │Sequen- │     │Valida- │     │Archive │
    │  cer   │     │  tor   │     │  Node  │
    └────────┘     └────────┘     └────────┘
```

---

## 1. Sequencer Nodes (Shard Operators)

### Function
- **Order transactions** within a shard
- **Produce micro-blocks** every 200ms
- **Batch transactions** into commitments every 1s
- **Submit batches** to base layer validators
- **Execute smart contracts** (EVM + WASM)

### Responsibilities
- Transaction mempool management
- Fee validation and rate limiting
- Gas metering and execution
- State updates within shard
- Cross-shard message routing

### Hardware Requirements
| Component | Specification |
|-----------|---------------|
| CPU | 64 vCPU (AMD EPYC/Intel Xeon) |
| RAM | 256 GB |
| Storage | 2TB NVMe SSD |
| Network | 100 Gbps NIC |
| Latency | < 1ms to validators |

### Revenue
- **100% of priority tips** from users
- High throughput = more tips

### Configuration
```toml
[sequencer]
shard_id = 0
micro_block_interval_ms = 200
batch_interval_ms = 1000
max_batch_size = 1000
rpc_port = 27000
metrics_port = 9100
```

### Running a Sequencer
```bash
ionova_node sequencer \
  --shard-id 0 \
  --metrics-port 9100
```

---

## 2. Validator Nodes (Base Layer Consensus)

### Function
- **Validate batch commitments** from sequencers
- **Participate in PQ-BFT consensus**
- **Finalize state roots** with PQ signatures
- **Store checkpoint data**
- **Slash malicious sequencers**

### Responsibilities
- Committee member of consensus
- Verify batch proofs and state transitions
- Maintain chain finality
- Economic security through staking

### Hardware Requirements
| Component | Specification |
|-----------|---------------|
| CPU | 32 vCPU |
| RAM | 128 GB |
| Storage | 1TB NVMe SSD |
| Network | 25 Gbps NIC |

### Revenue
- **60% of base fees** (0.0001 + gas fees)
- Proportional to stake weight

### Staking Requirements
- **Minimum stake**: 100,000 IONX
- **Bond period**: 21 days unbonding
- **Slashing**: 5% for downtime, 100% for double-signing

### Configuration
```toml
[validator]
id = 0
moniker = "my-validator"
stake_amount = 100000
commission_rate = 0.05  # 5% commission
```

### Running a Validator
```bash
ionova_node validator --id 0
```

---

## 3. Full Nodes (Non-Validating)

### Function
- **Sync full blockchain state**
- **Provide RPC endpoints** for dApps
- **Relay transactions** to network
- **No consensus participation**

### Responsibilities
- Serve JSON-RPC queries
- Forward transactions to sequencers
- Maintain recent state (last N blocks)
- Support light clients

### Hardware Requirements
| Component | Specification |
|-----------|---------------|
| CPU | 16 vCPU |
| RAM | 64 GB |
| Storage | 512 GB SSD |
| Network | 10 Gbps |

### Revenue
- **None** (unless providing RPC as a service)
- Useful for dApp infrastructure

### Running a Full Node
```bash
ionova_node full \
  --rpc-port 8545 \
  --sync-mode fast
```

---

## 4. Archive Nodes

### Function
- **Store complete history** of all shards
- **Provide historical queries**
- **Support block explorers**

### Responsibilities
- Maintain full state since genesis
- Serve historical RPC queries
- Never prune old data

### Hardware Requirements
| Component | Specification |
|-----------|---------------|
| CPU | 32 vCPU |
| RAM | 256 GB |
| Storage | 10+ TB (grows over time) |
| Network | 25 Gbps |

### Revenue
- **None** (typically run by foundations/explorers)

### Running an Archive Node
```bash
ionova_node archive \
  --pruning none \
  --storage-path /data/archive
```

---

## 5. Light Clients

### Function
- **Minimal state verification**
- **Use merkle proofs** for verification
- **Rely on full nodes** for data

### Responsibilities
- Verify block headers only
- Trust assumptions on full nodes
- Submit transactions

### Hardware Requirements
| Component | Specification |
|-----------|---------------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Storage | 1 GB |
| Network | Standard internet |

### Use Cases
- Mobile wallets
- Browser extensions
- IoT devices

---

## Node Comparison

| Feature | Sequencer | Validator | Full Node | Archive | Light |
|---------|-----------|-----------|-----------|---------|-------|
| **Consensus** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Execute Txs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Full State** | ✅ (shard) | ✅ | ✅ | ✅ | ❌ |
| **History** | Recent | Checkpoints | Recent | All | Headers |
| **Revenue** | Tips | 60% fees | Optional | None | None |
| **Staking** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Hardware** | Very High | High | Medium | Very High | Low |

---

## Network Topology

```
       Internet
          │
    ┌─────┴─────┐
    │           │
Sequencer   Sequencer
 Shard 0     Shard 1
    │           │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │           │
Validator   Validator   Validator
   Node        Node        Node
    │           │           │
    └─────┬─────┴─────┬─────┘
          │           │
      Full Node   Archive Node
          │
    Light Clients
```

---

## Economic Incentives

### Sequencer Economics

**Costs:**
- Hardware: $5,000-10,000/month
- Bandwidth: $2,000/month
- Operations: $3,000/month

**Revenue (at 5,000 TPS):**
- Tips: ~0.001 IONX/tx average
- 5,000 tx/s × 0.001 = 5 IONX/s
- 5 × 86,400 = 432,000 IONX/day
- At $1/IONX = **$432,000/day**

**ROI:** Highly profitable at scale

### Validator Economics

**Costs:**
- Hardware: $2,000-4,000/month
- Bandwidth: $1,000/month
- Operations: $1,000/month

**Revenue:**
- Base fees: 60% of network fees
- If network processes 40,000 TPS:
  - 40,000 × 0.05 IONX/tx × 86,400 s = 172.8M IONX/day
  - 60% = 103.68M IONX/day
  - Split among ~21 validators = 4.9M IONX/day each
  - At $1/IONX = **$4.9M/day per validator**

**ROI:** Extremely profitable

---

## Slashing Conditions

### Sequencer Slashing
- **Invalid batches**: Lose sequencer rewards for 24h
- **Censorship**: Permanent removal from sequencer set
- **Downtime >1h**: Warning, then replacement

### Validator Slashing
- **Double-signing**: 100% stake slashed
- **Downtime >24h**: 5% stake slashed
- **Invalid votes**: 10% stake slashed
- **Coordinated attack**: 100% stake + jail

---

## Becoming a Node Operator

### Sequencer
1. **Hardware**: Provision high-performance server
2. **Stake**: No staking required (permissionless)
3. **Register**: Announce sequencer intent on-chain
4. **Sync**: Download shard state
5. **Run**: Start sequencer for assigned shard

### Validator
1. **Stake**: Lock 100,000+ IONX
2. **Hardware**: Provision validator server
3. **Register**: Submit validator transaction
4. **Wait**: Bonding period (7 days)
5. **Activate**: Join active validator set

---

## Monitoring & Metrics

All nodes expose Prometheus metrics:

```bash
curl http://localhost:9100/metrics
```

**Key metrics:**
- `shard_X_transactions_per_second` - TPS
- `shard_X_avg_latency_milliseconds` - Latency
- `shard_X_mempool_size` - Pending txs
- `validator_X_block_height` - Sync status
- `validator_X_peer_count` - Network health

---

## Network Upgrades

Nodes must upgrade when:
- **Hard fork**: All nodes must upgrade
- **Soft fork**: Validators must upgrade
- **Config change**: Via governance notification

**Upgrade process:**
1. Governance proposal passes
2. 48-hour timelock
3. Scheduled block height for activation
4. Nodes upgrade before height

---

## Support

- **Docs**: https://docs.ionova.network/nodes
- **Discord**: #node-operators channel
- **Status**: https://status.ionova.network
- **Alerts**: Subscribe to node-operator mailing list

# Ionova Node Hardware Requirements

## Overview

Hardware requirements vary significantly based on node type and network load. This guide covers all node types from light clients to high-performance sequencers.

---

## Production Requirements (500k TPS)

### 1. Sequencer Node (High Performance)

**Each shard processes 5,000 TPS**

| Component | Minimum | Recommended | Enterprise |
|-----------|---------|-------------|------------|
| **CPU** | 32 cores (3.0 GHz+) | 64 cores (3.5 GHz+) | 128 cores (4.0 GHz+) |
| **RAM** | 128 GB DDR4 | 256 GB DDR4 | 512 GB DDR5 |
| **Storage** | 1TB NVMe SSD | 2TB NVMe SSD (RAID 10) | 4TB NVMe SSD (RAID 10) |
| **Network** | 25 Gbps | 100 Gbps | 100 Gbps (redundant) |
| **IOPS** | 100k | 500k+ | 1M+ |

**CPU Requirements:**
- **Architecture:** x86_64 (AMD EPYC or Intel Xeon)
- **Cores:** High core count for parallel transaction processing
- **Clock Speed:** 3.5+ GHz for single-threaded performance
- **Recommended Models:**
  - AMD EPYC 7763 (64 cores, 2.45 GHz base, 3.5 GHz boost)
  - Intel Xeon Platinum 8380 (40 cores, 2.3 GHz base, 3.4 GHz boost)
  - AMD Ryzen Threadripper PRO 5995WX (64 cores, 2.7 GHz)

**RAM Requirements:**
- **Minimum:** 128 GB for basic operation
- **Recommended:** 256 GB for mempool buffer
- **Speed:** DDR4-3200 or DDR5-4800
- **ECC:** Highly recommended for data integrity

**Storage Requirements:**
- **Type:** NVMe Gen 4 SSD (PCIe 4.0)
- **Capacity:** 2TB+ for state data and history
- **IOPS:** 500k+ read, 400k+ write
- **Endurance:** Enterprise-grade (3+ DWPD)
- **Recommended Models:**
  - Samsung PM9A3 (2TB, 800k IOPS)
  - Intel P5800X Optane (1.6TB, 1.5M IOPS)
  - WD Ultrastar DC SN840 (3.84TB, 800k IOPS)

**Network Requirements:**
- **Bandwidth:** 100 Gbps dual-port NIC
- **Latency:** < 1ms to validators
- **Connectivity:** Datacenter-grade with redundancy
- **Recommended NICs:**
  - Mellanox ConnectX-6 Dx (100 GbE)
  - Intel E810-CQDA2 (100 GbE)
  - Broadcom BCM57508 (100 GbE)

**Operating System:**
- Ubuntu 22.04 LTS (recommended)
- Red Hat Enterprise Linux 9
- Debian 12

**Monthly Cost Estimate:**
- **Bare Metal:** $2,000 - $5,000/month
- **Cloud (AWS c7g.16xlarge):** $3,500/month
- **Bandwidth:** $1,000 - $2,000/month

---

### 2. Validator Node (Medium Performance)

**Finalizes batches from all shards**

| Component | Minimum | Recommended | Enterprise |
|-----------|---------|-------------|------------|
| **CPU** | 16 cores (3.0 GHz+) | 32 cores (3.5 GHz+) | 64 cores (4.0 GHz+) |
| **RAM** | 64 GB | 128 GB | 256 GB |
| **Storage** | 500 GB NVMe SSD | 1TB NVMe SSD | 2TB NVMe SSD |
| **Network** | 10 Gbps | 25 Gbps | 100 Gbps |
| **IOPS** | 50k | 100k+ | 200k+ |

**CPU Requirements:**
- **Architecture:** x86_64
- **Cores:** Moderate count for BFT consensus
- **Recommended Models:**
  - AMD EPYC 7443P (24 cores)
  - Intel Xeon Gold 6338 (32 cores)
  - AMD Ryzen 9 7950X (16 cores, for smaller setups)

**RAM Requirements:**
- **Minimum:** 64 GB
- **Recommended:** 128 GB
- **ECC:** Mandatory for consensus safety

**Storage Requirements:**
- **Type:** NVMe SSD
- **Capacity:** 1TB for checkpoints and state roots
- **IOPS:** 100k+

**Network Requirements:**
- **Bandwidth:** 25 Gbps
- **Latency:** < 5ms to other validators
- **Connectivity:** Low-latency datacenter

**Monthly Cost Estimate:**
- **Bare Metal:** $800 - $2,000/month
- **Cloud (AWS m6i.8xlarge):** $1,200/month

---

### 3. Full Node (Standard Performance)

**Provides RPC endpoints for dApps**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 8 cores | 16 cores |
| **RAM** | 32 GB | 64 GB |
| **Storage** | 250 GB SSD | 512 GB NVMe |
| **Network** | 1 Gbps | 10 Gbps |
| **IOPS** | 10k | 50k |

**CPU Requirements:**
- Intel i7 or AMD Ryzen 7
- 8-16 cores sufficient

**RAM Requirements:**
- 32-64 GB
- No ECC needed

**Storage Requirements:**
- Standard SSD acceptable
- 512 GB for recent state

**Monthly Cost Estimate:**
- **VPS:** $100 - $300/month
- **Cloud (AWS t3.2xlarge):** $300/month

---

### 4. Archive Node (Maximum Storage)

**Stores complete history since genesis**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 16 cores | 32 cores |
| **RAM** | 128 GB | 256 GB |
| **Storage** | 5TB | 10-20TB+ |
| **Network** | 10 Gbps | 25 Gbps |

**Storage Requirements:**
- **Type:** High-capacity HDDs + NVMe cache
- **Capacity:** 10TB+ (grows over time)
- **Growth Rate:** ~1TB/year (estimated)
- **Architecture:**
  - 1TB NVMe for hot data
  - 10TB+ HDD for historical data

**Monthly Cost Estimate:**
- **Bare Metal:** $1,500 - $3,000/month
- **Storage costs dominate**

---

### 5. Light Client (Minimal)

**For wallets and mobile apps**

| Component | Specification |
|-----------|---------------|
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 1 GB |
| **Network** | Standard internet |

**Use Cases:**
- Mobile wallets
- Browser extensions
- IoT devices

**Monthly Cost:**
- Free (runs on user device)

---

## Devnet Requirements (40k TPS)

**For testing with 8 shards**

### Sequencer (Devnet)

| Component | Specification |
|-----------|---------------|
| **CPU** | 8 cores |
| **RAM** | 16 GB |
| **Storage** | 100 GB SSD |
| **Network** | 1 Gbps |

**Cost:** $50-100/month per sequencer

### Validator (Devnet)

| Component | Specification |
|-----------|---------------|
| **CPU** | 4 cores |
| **RAM** | 8 GB |
| **Storage** | 50 GB SSD |
| **Network** | 1 Gbps |

**Cost:** $30-50/month per validator

---

## Cloud Provider Recommendations

### AWS

| Node Type | Instance Type | vCPU | RAM | Storage | Cost/Month |
|-----------|---------------|------|-----|---------|------------|
| Sequencer | c7g.16xlarge | 64 | 128 GB | + 2TB EBS | ~$3,500 |
| Validator | m6i.8xlarge | 32 | 128 GB | + 1TB EBS | ~$1,200 |
| Full Node | t3.2xlarge | 8 | 32 GB | + 512GB EBS | ~$300 |

**Additional Costs:**
- EBS gp3: $0.08/GB/month
- Data transfer: $0.09/GB egress
- Total bandwidth for sequencer: +$1,000-2,000/month

### Google Cloud

| Node Type | Instance Type | vCPU | RAM | Cost/Month |
|-----------|---------------|------|-----|------------|
| Sequencer | c2-standard-60 | 60 | 240 GB | ~$3,200 |
| Validator | n2-standard-32 | 32 | 128 GB | ~$1,100 |
| Full Node | n2-standard-16 | 16 | 64 GB | ~$550 |

### Bare Metal Providers

| Provider | Sequencer Cost | Validator Cost |
|----------|----------------|----------------|
| **Hetzner** | $300-500/month | $150-250/month |
| **OVH** | $400-600/month | $200-300/month |
| **Equinix Metal** | $2,000-3,000/month | $800-1,200/month |

**Recommendation:** Bare metal for production (better performance/cost)

---

## Network Placement

### Geographic Distribution

**Validators:**
- Spread across 3+ continents
- Low latency between validators (< 50ms)
- Avoid single datacenter risk

**Sequencers:**
- Close to user base
- Consider regional sharding
- Example: US-East, EU-West, Asia-Pacific

### Connectivity Requirements

**Latency Targets:**
- Validator ↔ Validator: < 10ms
- Sequencer → Validator: < 50ms
- User → Sequencer: < 100ms

**Bandwidth Usage:**
- Sequencer (5k TPS): ~50 Gbps
- Validator: ~10 Gbps
- Full Node: ~2 Gbps

---

## Scaling Recommendations

### From Devnet to Production

**Phase 1: Devnet (8 shards, 40k TPS)**
- 8 × $100 sequencers = $800/month
- 3 × $50 validators = $150/month
- **Total:** ~$1,000/month

**Phase 2: Testnet (25 shards, 125k TPS)**
- 25 × $500 sequencers = $12,500/month
- 7 × $300 validators = $2,100/month
- **Total:** ~$15,000/month

**Phase 3: Mainnet (100 shards, 500k TPS)**
- 100 × $3,000 sequencers = $300,000/month
- 21 × $1,500 validators = $31,500/month
- **Total:** ~$330,000/month

**Revenue (at $0.10/IONX):**
- Sequencers: 100 × $60k/day = $6M/day
- Validators: 21 × $265k/day = $5.5M/day
- **Total:** ~$11.5M/day revenue

**ROI:** 1.1% daily cost vs. revenue = **extremely profitable**

---

## Monitoring Requirements

**Additional Infrastructure:**

| Service | Hardware | Cost |
|---------|----------|------|
| Prometheus | 8 cores, 32GB RAM, 500GB | $100/month |
| Grafana | 4 cores, 16GB RAM, 100GB | $50/month |
| Alerting | 2 cores, 8GB RAM | $30/month |

---

## Summary by Node Type

| Node Type | CPU | RAM | Storage | Network | Monthly Cost |
|-----------|-----|-----|---------|---------|--------------|
| **Sequencer** | 64 cores | 256 GB | 2TB NVMe | 100 Gbps | $3,000-5,000 |
| **Validator** | 32 cores | 128 GB | 1TB NVMe | 25 Gbps | $1,200-2,000 |
| **Full Node** | 16 cores | 64 GB | 512 GB | 10 Gbps | $300-500 |
| **Archive** | 32 cores | 256 GB | 10TB+ | 25 Gbps | $2,000-3,000 |
| **Light** | 2 cores | 4 GB | 1 GB | Standard | Free |

---

**For most operators: Start with devnet specs, scale to production as TVL grows!**

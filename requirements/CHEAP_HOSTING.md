# Budget Node Hosting for Ionova

## Cheap Hosting Options for Every Budget

Running an Ionova node doesn't have to break the bank! Here are cost-effective solutions.

---

## 🏆 Best Budget Options

### 1. Hetzner Dedicated Servers (Germany)

**Best for:** Production sequencers and validators

#### Sequencer Option
**AX102 Server**
- CPU: AMD Ryzen 9 7950X (16 cores, 32 threads, 4.5 GHz)
- RAM: 128 GB DDR5
- Storage: 2× 1.92TB NVMe SSD (RAID)
- Network: 1 Gbps (upgradable to 10 Gbps)
- **Price: €169/month (~$185/month)** 🔥

**Performance:** Can handle 2,000-3,000 TPS (good for shared sequencer)

#### Validator Option
**EX101 Server**
- CPU: Intel Core i9-13900 (24 cores)
- RAM: 64 GB DDR5
- Storage: 2× 1.92TB NVMe SSD
- Network: 1 Gbps
- **Price: €119/month (~$130/month)**

**Link:** https://www.hetzner.com/dedicated-rootserver

---

### 2. OVHcloud Bare Metal

#### Rise-4 Server (Budget Sequencer)
- CPU: AMD Ryzen 7 5800X (8 cores, 16 threads)
- RAM: 64 GB DDR4
- Storage: 2× 1TB NVMe SSD
- Network: 1 Gbps
- **Price: $89/month** 🔥🔥

Perfect for devnet or shared sequencer!

#### Advance-2 Server (Validator)
- CPU: AMD EPYC 7413P (24 cores)
- RAM: 128 GB DDR4
- Storage: 2× 960GB NVMe SSD
- Network: 1 Gbps
- **Price: $199/month**

**Link:** https://www.ovhcloud.com/en/bare-metal/

---

### 3. Contabo Dedicated Servers

**Ultra-Budget Option**

#### AMD EPYC 6338P
- CPU: 4 cores (from 32-core EPYC)
- RAM: 64 GB DDR4
- Storage: 1.92TB NVMe SSD
- Network: 1 Gbps
- **Price: €69.24/month (~$75/month)** 🔥🔥🔥

**Good for:** Full nodes or low-volume sequencers

**Link:** https://contabo.com/en/dedicated-servers/

---

### 4. AWS Spot Instances (Up to 90% off)

**For non-critical nodes**

#### c6a.8xlarge Spot
- vCPU: 32
- RAM: 64 GB
- **Regular:** $1,108/month
- **Spot:** $200-400/month (varies)
- Savings: 70-80%

**Caveat:** Can be terminated with 2-minute notice
**Use for:** Full nodes, testing, non-validator roles

---

### 5. Netcup Root Servers (Germany)

#### RS 4000 G10
- CPU: AMD EPYC 7443P (24 cores)
- RAM: 128 GB DDR4
- Storage: 2× 1.92TB NVMe SSD
- Network: 1 Gbps
- **Price: €129/month (~$140/month)**

**Link:** https://www.netcup.eu/bestellen/produkt.php?produkt=3050

---

## VPS Options (For Full Nodes)

### Hetzner Cloud

#### CPX51
- vCPU: 16
- RAM: 32 GB
- Storage: 360 GB NVMe
- Network: 20 TB traffic
- **Price: €47.93/month (~$52/month)**

Perfect for RPC full node!

### DigitalOcean

#### CPU-Optimized Droplet
- vCPU: 16
- RAM: 32 GB
- Storage: 200 GB SSD
- **Price: $168/month**

### Linode (Akamai)

#### Dedicated 32GB
- vCPU: 16
- RAM: 32 GB
- Storage: 640 GB SSD
- **Price: $144/month**

---

## Ultra-Budget Setup

### Devnet/Testing (Total: $30-50/month)

**Option 1: Single VPS for All**
- **Hetzner CCX33**: 8 vCPU, 32GB RAM, €33/month
- Run: 1 validator + 2 sequencers

**Option 2: Shared VPS**
- **Contabo VPS L**: 10 vCPU, 60GB RAM, $19.99/month
- Good for learning/testing

---

## Home Server Option

**Build Your Own**

### Budget Build (~$2,000 one-time)
- **CPU:** AMD Ryzen 9 5900X (12 cores) - $350
- **Motherboard:** MSI B550 - $150
- **RAM:** 64GB DDR4 - $150
- **Storage:** 1TB NVMe SSD - $80
- **Case + PSU:** $150
- **Total:** ~$900 + electricity

**Monthly Cost:**
- Electricity: ~$30/month (500W @ $0.12/kWh)
- Internet: 1 Gbps fiber - $50-100/month
- **Total: $80-130/month**

**Pros:** Full control, no hosting fees
**Cons:** Need reliable power, good internet, cooling

---

## Comparison Table

| Provider | Type | CPU | RAM | Storage | Network | Price/Month |
|----------|------|-----|-----|---------|---------|-------------|
| **Hetzner AX102** | Bare Metal | 16c Ryzen 9 | 128GB | 2TB NVMe | 1 Gbps | **$185** 🏆 |
| **OVH Rise-4** | Bare Metal | 8c Ryzen 7 | 64GB | 2TB NVMe | 1 Gbps | **$89** 🥇 |
| **Contabo EPYC** | Bare Metal | 4c EPYC | 64GB | 1.92TB NVMe | 1 Gbps | **$75** 🥈 |
| **Netcup RS4000** | Bare Metal | 24c EPYC | 128GB | 2TB NVMe | 1 Gbps | **$140** |
| **Hetzner CPX51** | VPS | 16 vCPU | 32GB | 360GB | 1 Gbps | **$52** |
| **AWS Spot** | Cloud | 32 vCPU | 64GB | EBS | 10 Gbps | **$200-400** |
| **Home Server** | Self-Hosted | 12c Ryzen | 64GB | 1TB NVMe | 1 Gbps | **$80-130** |

---

## Recommended Setups by Budget

### $75/month - Devnet/Learning
- **Contabo EPYC Server**
- Run: 1 validator + 3-4 sequencers
- Perfect for: Learning, development, small testnet

### $185/month - Single Production Sequencer
- **Hetzner AX102**
- Run: 1 high-performance sequencer
- Handle: 2,000-3,000 TPS
- **Revenue:** ~$200-300/day (at $0.10/IONX, 2k TPS)
- **ROI:** 4,000%+

### $500/month - Small Validator Setup
- 3× **OVH Rise-4** ($267)
- 1× **Hetzner CPX51** for monitoring ($52)
- Run: Multi-region validator with full node
- **Revenue:** ~$265k/day (validator earnings)
- **ROI:** 170,000%

### $2,000/month - Full Production Node
- 1× **Hetzner RX170** (48c EPYC, 256GB) - $500
- 3× **Netcup RS4000** (validators) - $420
- 5× **OVH Rise-4** (sequencers) - $445
- Monitoring + backup - $200
- **Can handle:** 10-15k TPS across 5 shards
- **Revenue:** ~$300k/day
- **ROI:** 450,000%

---

## Free Tier / Testing

### Google Cloud Free Tier
- e2-micro: 2 vCPU, 1GB RAM
- **Good for:** Light client, testing

### Oracle Cloud Always Free
- VM.Standard.E2.1.Micro: 1 vCPU, 1GB RAM
- **Good for:** Development, learning

### AWS Free Tier
- t2.micro: 1 vCPU, 1GB RAM (750 hrs/month for 12 months)
- **Good for:** Testing scripts

---

## Cost Optimization Tips

### 1. Use Spot/Preemptible Instances
- AWS Spot: 70-90% discount
- GCP Preemptible: 80% discount
- **Risk:** Can be terminated
- **Solution:** Use for non-critical full nodes

### 2. Annual Prepayment Discounts
- Hetzner: Pay annually, save 10%
- OVH: 12-month commit, save 15%
- **Example:** $185/month → $166/month (annual)

### 3. Multi-Server Bulk Pricing
- Some providers discount for 5+ servers
- Negotiate custom pricing

### 4. Bandwidth Optimization
- Use CDN for RPC endpoints (Cloudflare free tier)
- Compress logs
- Archive to cold storage (AWS S3 Glacier: $0.004/GB/month)

### 5. Shared Resources
- Run multiple light services on one server
- Example: 1 validator + 1 sequencer + monitoring

### 6. Energy-Efficient Hardware
- AMD EPYC: Better performance/watt than Intel
- Save $10-30/month on electricity

---

## Regional Pricing

**Cheapest Regions:**

| Region | Provider Example | Typical Savings |
|--------|------------------|-----------------|
| **Germany** | Hetzner, Netcup | 30-50% vs US |
| **France** | OVH, Scaleway | 25-40% vs US |
| **Poland** | Contabo | 40-60% vs US |
| **Singapore** | Vultr | 15-25% more expensive |
| **US** | AWS, DigitalOcean | Baseline |

**Recommendation:** EU servers (especially Germany) offer best value

---

## Minimum Viable Node

**Absolute cheapest option that works:**

**Contabo VPS L**
- 10 vCPU
- 60 GB RAM
- 1.6 TB SSD
- **Price: $19.99/month**

**Can run:**
- 1 validator (for testing)
- OR 1-2 sequencers (low TPS)
- OR 1 full node (RPC)

**Good for:** Learning, development, proof-of-concept

---

## Summary

**Best Overall:** Hetzner AX102 ($185/month) - Great performance, reasonable price
**Best Budget:** OVH Rise-4 ($89/month) - Solid specs, cheap
**Ultra Budget:** Contabo ($75/month) - Bare minimum for production
**Enterprise Scaling:** Mix of Hetzner + OVH for cost efficiency

**Rule of thumb:**
- Devnet: $50-100/month
- Single sequencer: $150-300/month
- Full validator: $400-800/month
- Production cluster: $2,000-5,000/month

Even at **$185/month**, a sequencer earning **$200/day** is a **3,000% monthly ROI**! 🚀

---

## Quick Start

1. **Sign up:** Hetzner.com
2. **Order:** AX102 server
3. **Install:** Ubuntu 22.04 LTS
4. **Deploy:** Docker compose from `/devnet`
5. **Monitor:** Grafana at port 3000
6. **Profit:** Start earning IONX! 

**Total time:** ~2 hours from signup to running node

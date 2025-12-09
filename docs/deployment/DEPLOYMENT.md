# Ionova Deployment Guide

Complete step-by-step guide to deploy Ionova from scratch.

---

## Prerequisites

### 1. Server Setup

**Minimum Requirements:**
- Ubuntu 22.04 LTS
- 16 vCPU, 64 GB RAM, 500 GB SSD
- 10 Gbps network
- Root access

**Get a Server:**
- Hetzner AX102: https://www.hetzner.com/dedicated-rootserver
- OVH Rise-4: https://www.ovhcloud.com/en/bare-metal/
- Or any VPS with similar specs

### 2. Domain (Optional but Recommended)
- Point `rpc.ionova.network` → Your server IP
- Point `explorer.ionova.network` → Server IP

---

## Part 1: Server Preparation

### Step 1: SSH into Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 4: Install Rust

```bash
# Install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Select option 1 (default)
# Restart shell or run:
source $HOME/.cargo/env

# Verify
cargo --version  # Should show 1.91.1 or newer
```

---

## Part 2: Clone & Build Ionova

### Step 1: Clone Repository

```bash
cd /opt
git clone https://github.com/ionova-network/ionova.git
cd ionova
```

**Or upload your local files:**
```bash
# On your Windows machine
scp -r f:\ionova root@YOUR_SERVER_IP:/opt/
```

### Step 2: Build Rust Node

```bash
cd /opt/ionova/node

# Build release binaries
cargo build --release

# This takes 10-20 minutes
# Binaries will be in: target/release/
```

### Step 3: Verify Build

```bash
./target/release/ionova_node --help
./target/release/load_generator --help
```

---

## Part 3: Deploy Blockchain Network

### Option A: Docker Compose (Recommended)

**Deploy full devnet with Docker:**

```bash
cd /opt/ionova/devnet

# Build Docker images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

**Services Started:**
- 3 validators (ports 26657, 26667, 26677)
- 8 sequencers (ports 27000-27700)
- Prometheus (port 9090)
- Grafana (port 3000)

### Option B: Manual Deployment

**Start Validator:**
```bash
cd /opt/ionova/node

# Run validator 0
./target/release/ionova_node validator --id 0 &

# Run validator 1
./target/release/ionova_node validator --id 1 &

# Run validator 2
./target/release/ionova_node validator --id 2 &
```

**Start Sequencers:**
```bash
# Shard 0
./target/release/ionova_node sequencer --shard-id 0 --metrics-port 9100 &

# Shard 1
./target/release/ionova_node sequencer --shard-id 1 --metrics-port 9101 &

# Shard 2-7...
# (repeat for all 8 shards)
```

---

## Part 4: Deploy Smart Contracts

### Step 1: Install Hardhat

```bash
cd /opt/ionova/contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers
```

### Step 2: Configure Network

Create `hardhat.config.js`:
```javascript
module.exports = {
  solidity: "0.8.24",
  networks: {
    ionova: {
      url: "http://localhost:27000",  // Shard 0
      chainId: 1,
      accounts: ["0xYOUR_PRIVATE_KEY"]
    }
  }
};
```

### Step 3: Deploy Contracts

```bash
# Deploy DEX
npx hardhat run scripts/deploy-dex.js --network ionova

# Deploy Lending
npx hardhat run scripts/deploy-lending.js --network ionova

# Deploy Staking
npx hardhat run scripts/deploy-staking.js --network ionova

# Deploy NFT Marketplace
npx hardhat run scripts/deploy-nft.js --network ionova

# Deploy DAO
npx hardhat run scripts/deploy-dao.js --network ionova
```

Create deployment scripts in `scripts/` directory.

---

## Part 5: Configure Monitoring

### Grafana Setup

```bash
# Access Grafana
http://YOUR_SERVER_IP:3000

# Default login:
# Username: admin
# Password: admin
```

**Add Dashboards:**
1. Go to Dashboards → Import
2. Upload: `/opt/ionova/devnet/grafana-dashboard.json`
3. View real-time metrics

### Prometheus

```bash
# Access Prometheus
http://YOUR_SERVER_IP:9090

# Check targets
http://YOUR_SERVER_IP:9090/targets
```

---

## Part 6: Deploy Frontend

### Step 1: Build React App

```bash
cd /opt/ionova/next_steps/website

# Install dependencies
npm install

# Build for production
npm run build

# Output in: dist/
```

### Step 2: Serve with Nginx

```bash
# Install Nginx
apt install -y nginx

# Copy build files
cp -r dist/* /var/www/html/

# Configure Nginx
cat > /etc/nginx/sites-available/ionova << 'EOF'
server {
    listen 80;
    server_name ionova.network www.ionova.network;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # RPC proxy
    location /rpc {
        proxy_pass http://localhost:27000;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/ionova /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 3: SSL with Let's Encrypt (Optional)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ionova.network -d www.ionova.network
```

---

## Part 7: Verification

### Check Nodes

```bash
# Check all Docker containers
docker compose ps

# Should show all 11 containers running:
# - validator-0, validator-1, validator-2
# - sequencer-0 through sequencer-7
# - prometheus
# - grafana
```

### Test RPC

```bash
# Get balance (should return 0x0 or balance)
curl -X POST http://localhost:27000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","latest"],"id":1}'

# Get chain ID
curl -X POST http://localhost:27000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Run Load Test

```bash
cd /opt/ionova/node

# Test with 1000 TPS across 8 shards
./target/release/load_generator \
  --shards 8 \
  --tps-per-shard 1000 \
  --duration 60 \
  --workers 100

# Expected output: ~8,000 TPS achieved
```

---

## Part 8: Production Hardening

### Firewall Setup

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow RPC (public)
ufw allow 27000:27700/tcp

# Allow metrics (restrict to monitoring server)
ufw allow from MONITORING_IP to any port 9090
ufw allow from MONITORING_IP to any port 9100:9107

# Enable
ufw enable
```

### Systemd Services

Create `/etc/systemd/system/ionova-validator-0.service`:
```ini
[Unit]
Description=Ionova Validator 0
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ionova/node
ExecStart=/opt/ionova/node/target/release/ionova_node validator --id 0
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable ionova-validator-0
systemctl start ionova-validator-0
systemctl status ionova-validator-0
```

Repeat for all nodes.

### Monitoring & Alerts

```bash
# Set up alerting in Prometheus
# Add to prometheus.yml:
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

# Configure alerts for:
# - Node down
# - High memory usage
# - Disk space low
# - TPS dropped
```

---

## Part 9: Maintenance

### Update Node

```bash
cd /opt/ionova/node
git pull
cargo build --release
docker compose down
docker compose up -d --build
```

### Backup

```bash
# Backup blockchain data
tar -czf ionova-backup-$(date +%Y%m%d).tar.gz /opt/ionova/data

# Upload to S3 or similar
aws s3 cp ionova-backup-*.tar.gz s3://your-bucket/
```

### Logs

```bash
# View logs
docker compose logs -f sequencer-0

# Save logs
docker compose logs > /var/log/ionova.log
```

---

## Quick Deployment Script

**One-command deployment:**

```bash
#!/bin/bash
# deploy-ionova.sh

set -e

echo "Installing dependencies..."
apt update && apt upgrade -y
apt install -y curl git docker.io docker-compose-plugin

echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

echo "Cloning Ionova..."
cd /opt
git clone https://github.com/ionova-network/ionova.git
cd ionova/node

echo "Building node..."
cargo build --release

echo "Starting devnet..."
cd ../devnet
docker compose build
docker compose up -d

echo "✅ Ionova deployed!"
echo "RPC: http://$(curl -s ifconfig.me):27000"
echo "Grafana: http://$(curl -s ifconfig.me):3000"
echo "Prometheus: http://$(curl -s ifconfig.me):9090"
```

**Run with:**
```bash
curl -sSL https://raw.githubusercontent.com/ionova-network/ionova/main/deploy.sh | bash
```

---

## Deployment Checklist

- [ ] Server provisioned (Ubuntu 22.04)
- [ ] Docker installed
- [ ] Rust installed
- [ ] Repository cloned
- [ ] Node built (`cargo build --release`)
- [ ] Docker compose up (`docker compose up -d`)
- [ ] All 11 containers running
- [ ] RPC responding (`curl http://localhost:27000`)
- [ ] Grafana accessible (port 3000)
- [ ] Smart contracts deployed
- [ ] Frontend built and served
- [ ] Firewall configured
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Domain DNS configured (if using)

---

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker compose logs

# Rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Rust Build Fails

```bash
# Install Visual Studio Build Tools (Windows)
# Or on Linux:
apt install build-essential pkg-config libssl-dev

# Clean and rebuild
cargo clean
cargo build --release
```

### Low TPS

```bash
# Check system resources
htop

# Increase limits
ulimit -n 65536

# Check network latency
ping validator-0
```

---

## Next Steps After Deployment

1. **Test Everything:** Run load generator, verify all protocols work
2. **Secure It:** Configure firewall, SSL, monitoring alerts
3. **Scale Up:** Add more sequencers for higher TPS
4. **Go Public:** Announce RPC endpoints, launch marketing
5. **Monitor:** Watch Grafana dashboards daily

---

**Estimated Deployment Time:**
- Server setup: 30 minutes
- Build & deploy: 1-2 hours
- Testing: 30 minutes
- **Total: 2-3 hours**

**You're now running a 500k TPS blockchain! 🚀**

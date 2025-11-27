#!/bin/bash
# Ionova One-Click Deployment Script
# Run with: bash deploy-ionova.sh

set -e

echo "════════════════════════════════════════════════"
echo "     🚀 Ionova Blockchain Deployment Script     "
echo "════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing Dependencies${NC}"
apt update && apt upgrade -y
apt install -y curl git build-essential pkg-config libssl-dev

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}🐳 Step 2: Installing Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

apt install -y docker-compose-plugin
echo ""

echo -e "${YELLOW}🦀 Step 3: Installing Rust${NC}"
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo -e "${GREEN}✓ Rust installed${NC}"
else
    echo -e "${GREEN}✓ Rust already installed${NC}"
fi
echo ""

echo -e "${YELLOW}📥 Step 4: Cloning Ionova Repository${NC}"
cd /opt
if [ ! -d "ionova" ]; then
    git clone https://github.com/ionova-network/ionova.git
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${YELLOW}! Repository already exists, pulling latest${NC}"
    cd ionova && git pull && cd ..
fi
echo ""

echo -e "${YELLOW}🔨 Step 5: Building Rust Node${NC}"
cd /opt/ionova/node
cargo build --release
echo -e "${GREEN}✓ Node built successfully${NC}"
echo ""

echo -e "${YELLOW}🐋 Step 6: Starting Docker Devnet${NC}"
cd /opt/ionova/devnet
docker compose build
docker compose up -d
echo -e "${GREEN}✓ Devnet started${NC}"
echo ""

echo -e "${YELLOW}⏳ Step 7: Waiting for services to start...${NC}"
sleep 10

echo -e "${YELLOW}🔍 Step 8: Checking Service Status${NC}"
docker compose ps
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo "════════════════════════════════════════════════"
echo -e "${GREEN}✅ Ionova Successfully Deployed!${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "📡 RPC Endpoints:"
echo "   Shard 0: http://$SERVER_IP:27000"
echo "   Shard 1: http://$SERVER_IP:27100"
echo "   ... (shards 2-7 on ports 27200-27700)"
echo ""
echo "📊 Monitoring:"
echo "   Grafana:    http://$SERVER_IP:3000"
echo "   Prometheus: http://$SERVER_IP:9090"
echo ""
echo "🔐 Grafana Login:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "📝 Logs:"
echo "   View all:        docker compose logs -f"
echo "   View sequencer:  docker compose logs -f sequencer-0"
echo "   View validator:  docker compose logs -f validator-0"
echo ""
echo "🛑 Stop devnet:     cd /opt/ionova/devnet && docker compose down"
echo "🔄 Restart devnet:  cd /opt/ionova/devnet && docker compose restart"
echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN}Happy Building! 🚀${NC}"
echo "════════════════════════════════════════════════"

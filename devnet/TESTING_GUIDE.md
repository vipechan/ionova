# DevNet Testing Guide

## Quick Start

### 1. Build the Node
```powershell
cd f:\ionova\node
cargo build --release
```

### 2. Start DevNet
```powershell
cd f:\ionova\devnet
docker-compose up -d
```

### 3. View Logs
```powershell
docker logs -f ionova-validator-0
```

### 4. Check Metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

### 5. Test Emission
```rust
// Query emission stats via RPC
curl http://localhost:26657/emission_stats
```

## Testing Checklist
- [ ] Build completes successfully
- [ ] Genesis block created  
- [ ] Validators start
- [ ] Sequencers connect
- [ ] Emission calculates correctly
- [ ] Fractions tracked properly
- [ ] Gas fees work (0.000001 IONX)

## Next Steps After DevNet
1. Deploy smart contracts
2. Test claim functionality
3. Verify all calculations  
4. Prepare for testnet

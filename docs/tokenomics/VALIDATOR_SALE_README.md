# Ionova Validator Fraction Sale

Complete NFT-based validator fraction sale system with bonding curve pricing ($10-$100).

## 🚀 Features

- **Smart Contract**: ERC-1155 NFTs representing fractional validator ownership
- **Bonding Curve**: Linear pricing from $10 to $100 over 1.8M fractions
- **KYC Integration**: Compliant whitelist-based verification
- **Rewards**: Automatic IONX token distribution to fraction holders
- **Frontend**: Beautiful React UI with Web3 integration
- **Tradeable**: Fully tradeable on OpenSea and NFT marketplaces

## 📁 Project Structure

```
ionova/
├── contracts/                    # Smart contracts
│   ├── ValidatorFractionNFT.sol  # Main sale contract (ERC-1155)
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── package.json              # Dependencies
│   ├── scripts/
│   │   └── deploy-validator-sale.js
│   └── test/
│       ├── ValidatorFractionNFT.test.js
│       └── MockERC20.sol
│
└── next_steps/website/           # Frontend application
    ├── src/
    │   ├── components/           # React components
    │   │   ├── SaleDashboard.jsx
    │   │   ├── PurchaseForm.jsx
    │   │   └── HoldingsView.jsx
    │   ├── hooks/
    │   │   └── useValidatorSale.js
    │   ├── pages/
    │   │   └── ValidatorSale.jsx
    │   ├── styles/
    │   │   └── ValidatorSale.css
    │   └── contracts/
    │       └── ValidatorFractionNFT.json
    └── package.json
```

## 🔧 Setup

### Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env and add your keys

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npm run deploy:sepolia

# Deploy to mainnet
npm run deploy:ethereum
```

### Frontend

```bash
cd next_steps/website

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env and add contract addresses

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 Contract Deployment

1. **Configure Environment**:
   - Set `PRIVATE_KEY` for deployment wallet
   - Set `INFURA_API_KEY` for RPC access
   - Set `USDC_ADDRESS` for payment token
   - Set `TREASURY_ADDRESS` for funds recipient

2. **Deploy Contract**:
   ```bash
   npm run deploy:sepolia  # Testnet
   npm run deploy:ethereum # Mainnet
   ```

3. **Post-Deployment**:
   - Verify contract on Etherscan
   - Set IONX token address via `setIonxToken()`
   - Add KYC admins via `setKYCAdmin()`
   - Update frontend `.env` with contract address

## 🎯 Key Contract Functions

### Admin Functions
- `setKYCStatus(address user, bool verified)` - Verify users for KYC
- `setKYCAdmin(address admin, bool status)` - Add/remove KYC admins
- `setIonxToken(address token)` - Configure IONX reward token
- `setSaleTimes(uint256 start, uint256 end)` - Update sale period
- `pause()` / `unpause()` - Emergency controls

### User Functions
- `buyFractions(uint256 quantity)` - Purchase fractions
- `claimRewards()` - Claim accumulated IONX rewards
- `getCurrentPrice()` - Get current fraction price
- `getSaleStats()` - View sale statistics
- `getPendingRewards(address owner)` - Check unclaimed rewards

## 💻 Frontend Usage

The frontend provides three main views:

### 1. Overview Dashboard
- Real-time sale statistics
- Bonding curve visualization
- Progress tracking

### 2. Buy Fractions
- Quantity selector
- Cost calculator
- ROI projections
- USDC approval & purchase flow

### 3. My Holdings
- Owned fractions
- Pending rewards
- Claim rewards button
- Validator distribution

## 🔐 Security Features

- ✅ OpenZeppelin contracts (ERC-1155, Ownable, ReentrancyGuard, Pausable)
- ✅ Gas-optimized fraction counting
- ✅ KYC whitelist enforcement
- ✅ Time-based sale controls
- ✅ Emergency pause functionality
- ✅ Emergency withdraw functions

## 📊 Economics

- **Total Fractions**: 1,800,000
- **Validators for Sale**: 18 (100,000 fractions each)
- **Starting Price**: $10 per fraction
- **Ending Price**: $100 per fraction
- **Total Potential Raise**: ~$100,000,000
- **Daily Rewards**: 970 IONX per fraction
- **Estimated APR**: 1,940% - 9,700% (price dependent)

## 🧪 Testing

The contract includes comprehensive tests covering:
- Bonding curve pricing accuracy
- Purchase flow and NFT minting
- KYC enforcement
- Pause functionality
- Reward claiming
- Edge cases and error conditions

Run tests:
```bash
npx hardhat test
npx hardhat coverage  # With coverage report
REPORT_GAS=true npx hardhat test  # With gas reporting
```

## 🚢 Deployment Checklist

- [ ] Smart contract audited by professional firm
- [ ] Testnet deployment successful
- [ ] Frontend tested end-to-end
- [ ] KYC provider integrated
- [ ] USDC payment token configured
- [ ] IONX reward token deployed
- [ ] Treasury address set
- [ ] Sale start/end times configured
- [ ] Metadata URI configured
- [ ] Contract verified on Etherscan
- [ ] Frontend deployed to production

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)

## 🤝 Support

For questions or issues:
- Email: legal@ionova.network
- Docs: https://docs.ionova.network
- GitHub: https://github.com/ionova

## 📄 License

MIT License - see LICENSE file for details

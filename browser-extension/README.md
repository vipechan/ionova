# Ionova Browser Extension

Quantum-safe browser wallet for the Ionova blockchain.

## Features

- ✅ **Quantum-Safe Wallets**
  - Dilithium (recommended)
  - SPHINCS+ (ultra-secure)
  - Hybrid (ECDSA + PQ)
  - ECDSA (traditional)

- ✅ **Web3 Integration**
  - Injects `window.ionova` provider
  - Ethereum-compatible API
  - dApp connection
  - Transaction signing

- ✅ **Modern UI**
  - Beautiful glassmorphism design
  - Real-time balance updates
  - Transaction history
  - Network switching

## Installation

### For Users (Chrome Web Store)
Coming soon!

### For Developers (Local)

1. Clone repository
2. Open Chrome → Extensions → Developer mode
3. Click "Load unpacked"
4. Select `browser-extension` folder

## Usage

### For Users

1. Click extension icon
2. Create wallet (choose signature type)
3. Receive IONX tokens
4. Connect to Ionova dApps

### For Developers

```javascript
// Check if Ionova is injected
if (window.ionova) {
  console.log('Ionova Wallet detected!');
  
  // Get accounts
  const accounts = await window.ionova.getAccounts();
  
  // Get signature type
  const sigType = await window.ionova.getSignatureType();
  console.log('Using:', sigType); // "dilithium", "sphincs", etc.
  
  // Send transaction
  const tx = await window.ionova.sendTransaction({
    to: '0x...',
    value: '100000000000000000', // 0.1 IONX in wei
    gasLimit: 50000
  });
  
  // Estimate gas with specific signature
  const gas = await window.ionova.estimateGasWithSignature(
    { to: '0x...', value: '1000000' },
    'dilithium'
  );
}
```

## API Reference

### window.ionova

#### Properties
- `isIonova` - Always true
- `version` - Extension version

#### Methods

**Standard Web3:**
- `enable()` - Request account access
- `getAccounts()` - Get connected accounts
- `sendTransaction(tx)` - Send transaction
- `getBalance(address)` - Get balance

**Quantum-Safe Extensions:**
- `getSignatureType()` - Get current signature type
- `createQuantumWallet(type)` - Create quantum wallet
  - Types: 'ecdsa', 'dilithium', 'sphincs', 'hybrid'
- `estimateGasWithSignature(tx, sigType)` - Estimate gas for specific signature

## Security

- ✅ Private keys encrypted in storage
- ✅ User confirmation for all transactions
- ✅ Network validation
- ✅ Content Security Policy
- ✅ Minimal permissions

## Development

```bash
# Build (if using TypeScript)
npm run build

# Watch mode
npm run dev

# Load in Chrome
# Extensions → Developer mode → Load unpacked
```

## Files

```
browser-extension/
├── manifest.json      # Extension manifest
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Service worker
├── content.js         # Content script
├── inpage.js          # Injected provider
└── icons/             # Extension icons
```

## Permissions

- `storage` - Store wallet data
- `activeTab` - Access current tab
- `<all_urls>` - Inject provider on all sites

## Roadmap

- [x] Basic wallet functionality
- [x] Quantum signature support
- [x] Web3 provider injection
- [ ] Hardware wallet support
- [ ] Multi-account management
- [ ] Advanced transaction options
- [ ] Network management UI
- [ ] Mobile app sync

## Contributing

See CONTRIBUTING.md

## License

MIT

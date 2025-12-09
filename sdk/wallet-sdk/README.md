# Ionova Quantum-Safe Wallet SDK

JavaScript/TypeScript SDK for building quantum-resistant wallets on Ionova blockchain.

## Installation

```bash
npm install @ionova/wallet-sdk
# or
yarn add @ionova/wallet-sdk
```

## Quick Start

### ECDSA Wallet (Traditional - MetaMask Compatible)

```javascript
import { IonovaWallet, SignatureType } from '@ionova/wallet-sdk';

// Create ECDSA wallet
const wallet = IonovaWallet.createECDSA();

// Sign transaction
const tx = {
  from: wallet.address,
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: '100', // IONX
  nonce: 1,
  gasLimit: 21000,
  gasPrice: '0.000001'
};

const signedTx = await wallet.signTransaction(tx);
await wallet.sendTransaction(signedTx);

// Gas cost: 24,000 (21k base + 3k ECDSA signature)
```

### Dilithium Wallet (Quantum-Safe) 🔐

```javascript
import { IonovaWallet, SignatureType } from '@ionova/wallet-sdk';

// Create quantum-safe Dilithium wallet
const wallet = IonovaWallet.createDilithium();

// Sign transaction with quantum-resistant signature
const tx = {
  from: wallet.address,
  to: 'ionova1qpzry9x8gf2tvdw0s3jn54khce6mua7l5w8j3',
  value: '200', // IONX
  nonce: 2,
  gasLimit: 50000,
  gasPrice: '0.000001'
};

const signedTx = await wallet.signTransaction(tx);
await wallet.sendTransaction(signedTx);

// Gas cost: 46,000 (21k base + 25k subsidized Dilithium)
// Without subsidy would be 71,000!
```

### Hybrid Wallet (Maximum Security) 🛡️

```javascript
import { IonovaWallet } from '@ionova/wallet-sdk';

// Create hybrid wallet (ECDSA + Dilithium)
const wallet = IonovaWallet.createHybrid();

// Sign with both ECDSA and quantum-safe signatures
const tx = await wallet.signTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: '300',
  nonce: 3
});

await wallet.sendTransaction(tx);

// Gas cost: 28,000 (21k base + 3k ECDSA + 4k subsidized PQ)
// Most affordable quantum-safe option!
```

## API Reference

### IonovaWallet

#### Static Methods

```typescript
// Create wallets
static createECDSA(): IonovaWallet
static createDilithium(): IonovaWallet
static createSPHINCSPlus(): IonovaWallet
static createFalcon(): IonovaWallet
static createHybrid(): IonovaWallet

// Import from private key
static fromPrivateKey(privateKey: string, type: SignatureType): IonovaWallet

// Import from mnemonic
static fromMnemonic(mnemonic: string, type: SignatureType): IonovaWallet
```

#### Instance Methods

```typescript
// Sign transaction
async signTransaction(tx: Transaction): Promise<SignedTransaction>

// Send transaction
async sendTransaction(tx: SignedTransaction): Promise<TransactionReceipt>

// Get balance
async getBalance(): Promise<string>

// Properties
address: string
publicKey: string
signatureType: SignatureType
```

### Transaction Interface

```typescript
interface Transaction {
  from?: string;        // Auto-filled from wallet
  to: string;          // Recipient address
  value: string;       // Amount in IONX
  nonce?: number;      // Auto-fetched if not provided
  gasLimit?: number;   // Default: 21,000
  gasPrice?: string;   // Default: dynamic
  data?: string;       // Optional data payload
}
```

### SignatureType Enum

```typescript
enum SignatureType {
  ECDSA = 'ecdsa',
  Dilithium = 'dilithium',
  SPHINCSPlus = 'sphincsplus',
  Falcon = 'falcon',
  Hybrid = 'hybrid'
}
```

## Gas Costs

| Signature Type | Gas Cost | Fee (IONX) | Quantum-Safe |
|----------------|----------|------------|--------------|
| ECDSA | 24,000 | 0.024 | ❌ |
| Dilithium | 46,000 | 0.046 | ✅ |
| SPHINCS+ | 55,500 | 0.056 | ✅ |
| Falcon | 38,500 | 0.039 | ✅ |
| Hybrid | 28,000 | 0.028 | ✅ |

**Note:** PQ signatures have 50% gas subsidy during migration period (2025-2030).

## Migration Guide

### Phase 1: Create Hybrid Wallet (Recommended)

```javascript
// Use hybrid wallet during transition
const wallet = IonovaWallet.createHybrid();

// Transactions are quantum-safe but still compatible with old systems
await wallet.sendTransaction({/*...*/});
```

### Phase 2: Full Migration to Dilithium

```javascript
// Once fully migrated, use pure Dilithium
const wallet = IonovaWallet.createDilithium();

// Smaller transactions than hybrid mode
await wallet.sendTransaction({/*...*/});
```

## React Integration

```jsx
import { IonovaWallet, useWallet } from '@ionova/wallet-sdk/react';

function WalletConnect() {
  const { wallet, connect, disconnect, signTransaction } = useWallet();

  const handleConnect = async () => {
    // Let user choose signature type
    const wallet = IonovaWallet.createDilithium(); // Quantum-safe!
    await connect(wallet);
  };

  return (
    <div>
      {!wallet ? (
        <button onClick={handleConnect}>
          Connect Quantum-Safe Wallet 🔐
        </button>
      ) : (
        <div>
          <p>Connected: {wallet.address}</p>
          <p>Type: {wallet.signatureType}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Gas Calculation

```javascript
const wallet = IonovaWallet.createDilithium();

// Calculate gas cost before sending
const tx = {
  to: '0x...',
  value: '100'
};

const gasEstimate = await wallet.estimateGas(tx);
console.log(`Estimated gas: ${gasEstimate}`);
// Output: 46,000 (with subsidy)

const fee = gasEstimate * 0.000001; // IONX
console.log(`Fee: ${fee} IONX`);
```

### Batch Transactions

```javascript
const wallet = IonovaWallet.createHybrid();

const txs = [
  { to: '0x...', value: '10' },
  { to: '0x...', value: '20' },
  { to: '0x...', value: '30' },
];

const signedTxs = await Promise.all(
  txs.map(tx => wallet.signTransaction(tx))
);

const receipts = await wallet.sendBatch(signedTxs);
```

### Wallet Utilities

```javascript
import { utils } from '@ionova/wallet-sdk';

// Convert between address formats
const evmAddr = '0x742d35Cc...';
const nativeAddr = utils.evmToNative(evmAddr);
console.log(nativeAddr); // ionova1qpzry9x8gf...

// Validate signatures
const isValid = await utils.verifySignature(tx, signature, publicKey);

// Calculate transaction hash
const txHash = utils.hashTransaction(tx);
```

## Security Best Practices

### ✅ DO

- Use Dilithium or Hybrid for new wallets
- Store private keys securely (never plaintext)
- Verify transaction details before signing
- Use hardware wallets for large amounts

### ❌ DON'T

- Don't use ECDSA for new wallets (quantum-vulnerable)
- Don't share private keys
- Don't skip signature verification
- Don't reuse nonces

## Browser Support

| Browser | ECDSA | Dilithium | Hybrid |
|---------|-------|-----------|--------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |

## Dependencies

```json
{
  "dependencies": {
    "@noble/secp256k1": "^2.0.0",
    "@noble/post-quantum": "^1.0.0",
    "ethers": "^6.0.0"
  }
}
```

## Examples

See `/examples` directory for complete demos:
- `ecdsa-wallet.js` - Traditional wallet
- `quantum-wallet.js` - Dilithium wallet
- `hybrid-wallet.js` - Maximum security
- `react-app/` - Full React integration

## License

MIT

## Resources

- [Migration Strategy](../QUANTUM_MIGRATION_STRATEGY.md)
- [Node Documentation](../node/QUANTUM_SIGNATURES.md)
- [API Reference](https://docs.ionova.network)

---

**Build the quantum-safe future!** 🚀🔐

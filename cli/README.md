# Ionova CLI

Command-line interface for the Ionova quantum-safe blockchain.

## Installation

```bash
npm install -g @ionova/cli
```

Or use locally:
```bash
npm install
npm link
```

## Commands

### Wallet Management

**Create a new wallet:**
```bash
# Create default Dilithium wallet
ionova wallet:create

# Create ECDSA wallet
ionova wallet:create --type ecdsa

# Create with custom name
ionova wallet:create --name myWallet --type hybrid
```

**List all wallets:**
```bash
ionova wallet:list
```

### Balance Operations

**Check balance:**
```bash
ionova balance --address 0x...
```

**With custom network:**
```bash
ionova balance --address 0x... --network http://testnet.ionova.network
```

### Sending Transactions

**Send IONX:**
```bash
ionova send --to 0x... --amount 100 --wallet myWallet
```

**With custom network:**
```bash
ionova send --to 0x... --amount 50 --network http://testnet.ionova.network
```

### Network Commands

**Check network status:**
```bash
ionova network:status
```

**With custom RPC:**
```bash
ionova network:status --network http://mainnet.ionova.network
```

## Signature Types

- **ecdsa** - Traditional ECDSA (Ethereum-compatible)
- **dilithium** - Quantum-safe Dilithium (recommended)
- **sphincs** - Ultra-secure SPHINCS+
- **hybrid** - ECDSA + Dilithium (maximum security)

## Examples

```bash
# Create quantum-safe wallet
ionova wallet:create --type dilithium --name quantum-wallet

# List all wallets
ionova wallet:list

# Check balance
ionova balance --address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Send tokens
ionova send --to 0x123... --amount 100 --wallet quantum-wallet

# Check network
ionova network:status --network http://localhost:27000
```

## Configuration

Wallets are stored in: `~/.ionova/`

## Security

⚠️ **Important:** In production, private keys should be encrypted!

The current implementation stores wallet information. For production use:
1. Encrypt private keys
2. Use password protection
3. Consider hardware wallet integration

## Development

```bash
npm install
npm run dev -- wallet:create
```

## Building

```bash
npm run build
```

## License

MIT

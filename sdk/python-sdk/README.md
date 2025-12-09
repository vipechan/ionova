# Ionova Python SDK

Official Python SDK for the Ionova quantum-safe blockchain.

## Installation

```bash
pip install ionova-sdk
```

## Features

- ✅ **4 Signature Types**
  - ECDSA (traditional)
  - Dilithium (quantum-safe, recommended)
  - SPHINCS+ (ultra-secure)
  - Hybrid (ECDSA + PQ)

- ✅ **Full Wallet Operations**
  - Create wallets
  - Sign transactions
  - Send transactions
  - Query balances

- ✅ **Type-Safe API**
  - Full type hints
  - Dataclasses for transactions
  - Enums for signature types

## Quick Start

```python
from ionova import IonovaWallet, RpcClient
from decimal import Decimal

# Connect to Ionova
client = RpcClient("http://localhost:27000")

# Create quantum-safe wallet
wallet = IonovaWallet.create_dilithium()

# Check balance
balance = client.get_balance(wallet.address)
print(f"Balance: {balance} IONX")

# Send transaction
tx_hash = await wallet.send_transaction(
    client,
    to="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value=Decimal("100"),
)
print(f"Transaction: {tx_hash}")
```

## Examples

### Create Different Wallet Types

```python
# ECDSA (traditional)
wallet = IonovaWallet.create_ecdsa()

# Dilithium (recommended for quantum safety)
wallet = IonovaWallet.create_dilithium()

# SPHINCS+ (maximum security)
wallet = IonovaWallet.create_sphincs()

# Hybrid (ECDSA + Dilithium)
wallet = IonovaWallet.create_hybrid()
```

### Check Balance

```python
from ionova import RpcClient

client = RpcClient("http://localhost:27000")
balance = client.get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
print(f"{balance} IONX")
```

### Send Transaction

```python
from decimal import Decimal

tx_hash = await wallet.send_transaction(
    client,
    to="0x...",
    value=Decimal("50"),
    gas_limit=50000,
)
```

## API Reference

### IonovaWallet

- `create_ecdsa()` - Create ECDSA wallet
- `create_dilithium()` - Create Dilithium wallet (recommended)
- `create_sphincs()` - Create SPHINCS+ wallet
- `create_hybrid()` - Create Hybrid wallet
- `send_transaction(client, to, value)` - Send transaction

### RpcClient

- `get_balance(address)` - Get account balance
- `get_transaction_count(address)` - Get nonce
- `send_transaction(tx)` - Send raw transaction
- `get_chain_id()` - Get network chain ID

## Development

```bash
# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black ionova/

# Type checking
mypy ionova/
```

## License

MIT

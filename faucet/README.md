# Ionova Testnet Faucet

Get free testnet IONX tokens for development and testing!

## Features

- ✅ Rate limiting (1 request/hour per IP)
- ✅ Address limiting (5 requests/day per address)
- ✅ Automatic transaction handling
- ✅ Balance monitoring
- ✅ Health checks
- ✅ CORS enabled

## API Endpoints

### GET /health
Health check endpoint
```json
{
  "status": "ok",
  "network": "Ionova Testnet",
  "faucetAmount": "100 IONX"
}
```

### GET /info
Get faucet information
```json
{
  "address": "0x...",
  "amount": "100 IONX",
  "rateLimit": "1 request per hour per IP",
  "addressLimit": "5 requests per day per address"
}
```

### POST /request
Request testnet tokens
```bash
curl -X POST http://localhost:5000/request \
  -H "Content-Type: application/json" \
  -d '{"address": "0x..."}'
```

Response:
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "100 IONX",
  "to": "0x...",
  "blockNumber": 12345
}
```

### GET /balance
Get faucet balance
```json
{
  "address": "0x...",
  "balance": "1000000.0",
  "balanceIONX": "1000000.0 IONX"
}
```

## Environment Variables

```env
PORT=5000
RPC_URL=http://localhost:27000
FAUCET_AMOUNT=100
FAUCET_PRIVATE_KEY=0x...
```

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t ionova-faucet .
docker run -p 5000:5000 -e RPC_URL=http://sequencer:27000 ionova-faucet
```

## Rate Limits

- **Per IP:** 1 request per hour
- **Per Address:** 5 requests per 24 hours

Exceeding limits returns 429 status with retry time.

## Security

- Input validation (Ethereum address format)
- Rate limiting (IP and address based)
- Balance checks before sending
- Error handling and logging
- CORS protection

## Frontend Integration

```typescript
async function requestTokens(address: string) {
  const response = await fetch('http://localhost:5000/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log(`Received ${data.amount}! TX: ${data.txHash}`);
  }
}
```

## Monitoring

Check faucet balance regularly:
```bash
curl http://localhost:5000/balance
```

Refill when balance is low!

# IonoPay: Zero-Fee Payment System

## Overview

**IonoPay** is Ionova's zero-fee payment transfer system designed to compete with traditional payment processors like Stripe, PayPal, and Visa. With 1-second settlement times and zero transaction fees, IonoPay makes Ionova the ideal platform for payments, e-commerce, and financial applications.

## Key Features

### 💰 Zero Transaction Fees
- **No fees for users** - Send any amount without paying transaction fees
- **No fees for merchants** - Accept payments without the 2-3% fees charged by traditional processors
- **Treasury-subsidized** - Fees are covered by the protocol treasury (sustainable for 1M+ daily payments)

### ⚡ Instant Settlement
- **1-second finality** - Payments confirmed in 1 second (vs 2-7 days for Stripe/PayPal)
- **Real-time notifications** - Instant payment confirmations
- **No chargebacks** - Merchant-controlled refunds only

### 🌍 Global Reach
- **Cross-border payments** - Free international transfers
- **No currency conversion fees** - Direct IONX transfers
- **24/7 availability** - No banking hours or holidays

### 🔒 Security & Trust
- **Blockchain-verified** - All payments recorded on-chain
- **Merchant verification** - KYC-verified merchants
- **Refund system** - Merchant-initiated refunds
- **Rate limiting** - Anti-spam protection

## For Users

### Sending Payments

#### Using the SDK

```javascript
import { IonovaSDK } from '@ionova/sdk';

// Initialize SDK
const sdk = new IonovaSDK(provider, signer);

// Send a payment
const receipt = await sdk.payments.sendPayment(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',  // recipient
  '10.5',  // amount in IONX
  {
    invoiceId: ethers.id('INV-12345'),
    memo: 'Payment for services',
    onProgress: (status) => console.log(status)
  }
);

console.log('Payment ID:', receipt.paymentId);
console.log('Transaction:', receipt.transactionHash);
```

#### Using the Web Interface

1. Go to [ionova.network/pay](https://ionova.network/pay)
2. Connect your wallet
3. Enter recipient address and amount
4. Add optional memo/invoice ID
5. Click "Send Payment" - **Zero fees!**
6. Confirm in 1 second

### Receiving Payments

#### Generate Payment QR Code

```javascript
// Generate QR code for receiving payments
const qrData = await sdk.payments.generatePaymentQR('25.00', {
  memo: 'Coffee payment',
  invoiceId: ethers.id('COFFEE-001')
});

// Display QR code (use any QR code library)
displayQRCode(qrData);
```

#### Check Payment History

```javascript
// Get your payment history
const payments = await sdk.payments.getPaymentHistory();

// Get details of a specific payment
const payment = await sdk.payments.getPayment(paymentId);
console.log(payment);
// {
//   from: '0x...',
//   to: '0x...',
//   amount: '10.5',
//   memo: 'Payment for services',
//   timestamp: Date,
//   status: 'Completed'
// }
```

### Rate Limits

To prevent spam, IonoPay has daily payment limits:

| User Type | Daily Limit | Max Amount |
|-----------|-------------|------------|
| **Unverified** | 100 payments | $10,000/tx |
| **Verified** | 1,000 payments | Unlimited |
| **Merchants** | Unlimited | Unlimited |

**To increase limits:** Register as a merchant and complete KYC verification.

## For Merchants

### Why IonoPay for Your Business?

| Feature | IonoPay | Stripe | PayPal | Visa |
|---------|---------|--------|--------|------|
| **Transaction Fee** | **0%** | 2.9% + $0.30 | 2.9% + $0.30 | 2-3% |
| **Settlement Time** | **1 second** | 2-7 days | 1-3 days | 1-2 days |
| **Cross-border Fee** | **0%** | 3.9% | 5% | 3% |
| **Chargeback Risk** | **None** | High | High | High |
| **Monthly Fee** | **$0** | $0 | $0 | Varies |

**Savings Example:**
- Monthly revenue: $100,000
- Stripe fees: $2,900 + $90 = **$2,990/month**
- IonoPay fees: **$0/month**
- **Annual savings: $35,880**

### Merchant Registration

#### 1. Register Your Business

```javascript
await sdk.payments.registerMerchant({
  name: 'My Online Store',
  category: 'E-commerce'
});
```

#### 2. Complete KYC (Optional but Recommended)

- Higher payment limits
- Verified badge
- Priority support
- Access to advanced features

Contact support@ionova.network to start KYC verification.

#### 3. Start Accepting Payments

```javascript
// Get your merchant profile
const profile = await sdk.payments.getMerchantProfile();
console.log(profile);
// {
//   name: 'My Online Store',
//   category: 'E-commerce',
//   verified: true,
//   totalReceived: '125000.50',
//   paymentCount: 1543
// }
```

### Accepting Payments

#### Method 1: Payment Widget (Easiest)

Embed a payment widget on your website:

```html
<!-- Add to your website -->
<div id="ionopay-widget"></div>
<script src="https://cdn.ionova.network/widget.js"></script>
<script>
  IonoPayWidget.init({
    merchant: '0xYourMerchantAddress',
    amount: '99.99',
    invoiceId: 'ORDER-12345',
    onSuccess: (payment) => {
      console.log('Payment received!', payment);
      // Fulfill order
    }
  });
</script>
```

#### Method 2: Direct Integration

```javascript
// Listen for incoming payments
sdk.payments.contract.on('PaymentSent', (paymentId, from, to, amount, invoiceId, memo) => {
  if (to === myMerchantAddress) {
    console.log('Payment received!');
    console.log('Amount:', ethers.formatEther(amount));
    console.log('Invoice:', invoiceId);
    
    // Fulfill order, send confirmation email, etc.
    fulfillOrder(invoiceId);
  }
});
```

### Merchant Analytics

```javascript
// Get your analytics
const analytics = await sdk.payments.getMerchantAnalytics();
console.log(analytics);
// {
//   totalRevenue: '125000.50',
//   paymentCount: 1543,
//   averagePayment: '81.02',
//   recentPayments: [...]
// }
```

### Processing Refunds

```javascript
// Refund a payment
await sdk.payments.refundPayment(paymentId);

// Customer receives full refund instantly
// Your stats are automatically updated
```

## Payment Channels (Advanced)

For high-frequency micropayments (e.g., streaming, gaming), use payment channels to enable instant off-chain payments.

### Opening a Channel

```javascript
// Open a channel with 100 IONX
const channel = await sdk.payments.openPaymentChannel(
  '0xCounterpartyAddress',
  '100'
);
```

### Using the Channel

```javascript
// Make instant off-chain payments
// (Implementation requires signed state updates)
// See technical documentation for details
```

### Closing a Channel

```javascript
// Initiate close (24-hour challenge period)
await sdk.payments.closePaymentChannel(channelId);

// After 24 hours, finalize
await sdk.payments.finalizeChannelClose(channelId);
```

**Benefits:**
- Unlimited payments between 2 parties
- Instant settlement (no blockchain confirmation needed)
- Only 2 on-chain transactions (open + close)
- Perfect for micropayments

## Use Cases

### 1. E-commerce
- Online stores
- Digital products
- Subscription services
- **Save 2.9% on every transaction**

### 2. Freelancing & Gig Economy
- Upwork alternative
- Fiverr alternative
- Direct client payments
- **No platform fees**

### 3. Remittances
- Cross-border transfers
- Family support
- International payments
- **Zero fees, instant settlement**

### 4. Micropayments
- Content creators
- Pay-per-view
- Gaming
- **Use payment channels for instant payments**

### 5. P2P Transfers
- Split bills
- Send money to friends
- Peer-to-peer marketplace
- **Venmo/Cash App alternative**

## Security Best Practices

### For Users
- ✅ Verify recipient address before sending
- ✅ Double-check payment amounts
- ✅ Keep your private keys secure
- ✅ Use hardware wallets for large amounts
- ❌ Never share your private key

### For Merchants
- ✅ Complete KYC verification
- ✅ Verify payment confirmations on-chain
- ✅ Implement proper invoice tracking
- ✅ Set up automated payment notifications
- ✅ Keep customer records secure

## API Reference

### Payment Methods

```javascript
// Send payment
await sdk.payments.sendPayment(to, amount, options)

// Refund payment
await sdk.payments.refundPayment(paymentId)

// Get payment details
await sdk.payments.getPayment(paymentId)

// Get payment history
await sdk.payments.getPaymentHistory(address)
```

### Merchant Methods

```javascript
// Register merchant
await sdk.payments.registerMerchant(businessInfo)

// Get merchant profile
await sdk.payments.getMerchantProfile(address)

// Get analytics
await sdk.payments.getMerchantAnalytics()
```

### Utility Methods

```javascript
// Generate payment QR
await sdk.payments.generatePaymentQR(amount, options)

// Parse QR code
sdk.payments.parsePaymentQR(qrData)

// Get global stats
await sdk.payments.getGlobalStats()
```

## Support

- **Documentation:** [docs.ionova.network/ionopay](https://docs.ionova.network/ionopay)
- **Discord:** [discord.gg/ionova](https://discord.gg/ionova) - #ionopay-support
- **Email:** support@ionova.network
- **Merchant Support:** merchants@ionova.network

## FAQ

**Q: Are payments really free?**
A: Yes! Transaction fees are subsidized by the protocol treasury, making payments completely free for users and merchants.

**Q: How is this sustainable?**
A: The treasury receives 10% of block rewards (~$250M/year). Payment subsidies cost only ~$1.8M/year (0.7% of treasury revenue).

**Q: What if I send to the wrong address?**
A: Blockchain transactions are irreversible. Always verify the recipient address. For merchant payments, you can request a refund from the merchant.

**Q: How do I become a verified merchant?**
A: Contact merchants@ionova.network to start the KYC verification process.

**Q: Can I accept payments on my website?**
A: Yes! Use our payment widget or integrate directly with the SDK.

**Q: What about chargebacks?**
A: Unlike credit cards, there are no chargebacks. Merchants have full control over refunds.

---

**Start accepting zero-fee payments today!** 🚀

Visit [ionova.network/ionopay](https://ionova.network/ionopay) to get started.

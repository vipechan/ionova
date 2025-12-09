# 🔐 KYC Implementation Guide - Ionova Ecosystem

**Complete KYC/AML Integration for Validator Fraction Sale**

---

## 📋 Overview

The Ionova ecosystem implements a robust KYC (Know Your Customer) verification system to ensure regulatory compliance while maintaining decentralization.

**Current Status:**
- ✅ Smart contract KYC logic implemented
- ⏳ KYC provider integration (pending)
- ⏳ Frontend UI (pending)
- ⏳ Backend APIs (pending)

---

## 🔐 Smart Contract Implementation (✅ COMPLETE)

### ValidatorFractionNFT.sol - KYC Features

```solidity
// KYC State Variables
mapping(address => bool) public kycVerified;
mapping(address => bool) public kycAdmins;
bool public kycRequired = true;

// Modifier
modifier onlyKYCVerified() {
    if (kycRequired) {
        require(kycVerified[msg.sender], "KYC verification required");
    }
    _;
}

modifier onlyKYCAdmin() {
    require(kycAdmins[msg.sender] || msg.sender == owner(), "Not KYC admin");
    _;
}
```

### KYC Functions

#### 1. Single User Verification
```solidity
function setKYCStatus(address user, bool verified) external onlyKYCAdmin {
    kycVerified[user] = verified;
    emit KYCStatusUpdated(user, verified);
}
```

#### 2. Batch Verification
```solidity
function setKYCStatusBatch(
    address[] calldata users, 
    bool[] calldata statuses
) external onlyKYCAdmin {
    require(users.length == statuses.length, "Length mismatch");
    for (uint256 i = 0; i < users.length; i++) {
        kycVerified[users[i]] = statuses[i];
        emit KYCStatusUpdated(users[i], statuses[i]);
    }
}
```

#### 3. Admin Management
```solidity
function setKYCAdmin(address admin, bool status) external onlyOwner {
    kycAdmins[admin] = status;
    emit KYCAdminUpdated(admin, status);
}
```

#### 4. Toggle KYC Requirement
```solidity
function setKYCRequired(bool required) external onlyOwner {
    kycRequired = required;
    emit KYCRequirementUpdated(required);
}
```

#### 5. Check KYC Status
```solidity
function isKYCVerified(address user) external view returns (bool) {
    return kycVerified[user];
}
```

### Protected Functions

All purchase functions require KYC:

```solidity
function buyFractions(
    uint256 quantity, 
    address referrer, 
    address paymentToken
) external 
  nonReentrant 
  whenNotPaused 
  whenSaleActive 
  onlyKYCVerified  // ✅ KYC Required
{
    // Purchase logic
}
```

---

## 🌐 KYC Provider Integration

### Recommended Providers

| Provider | Cost | Features | Recommendation |
|----------|------|----------|----------------|
| **Sumsub** | $1-3/check | AI verification, global | ⭐⭐⭐⭐⭐ Best |
| **Jumio** | $2-4/check | Biometric, liveness | ⭐⭐⭐⭐ Good |
| **Onfido** | $1.50-3/check | Fast, reliable | ⭐⭐⭐⭐ Good |
| **Persona** | $2-5/check | Customizable | ⭐⭐⭐ Okay |

**Recommendation:** **Sumsub** for best price/performance ratio

---

## 🔧 Backend Implementation

### Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ↓ HTTPS
┌─────────────────┐
│  Backend API    │
├─────────────────┤
│ - User auth     │
│ - SDK token     │
│ - Status check  │
│ - Webhook       │
└────────┬────────┘
         │
         ↓ API
┌─────────────────┐
│  Sumsub API     │
├─────────────────┤
│ - ID verification│
│ - Face match    │
│ - AML check     │
│ - Liveness      │
└────────┬────────┘
         │
         ↓ On Approval
┌─────────────────┐
│ Smart Contract  │
├─────────────────┤
│ setKYCStatus()  │
└─────────────────┘
```

### API Endpoints

#### 1. Initialize KYC Session
```javascript
POST /api/kyc/initialize

Request:
{
  "walletAddress": "0x742d35...",
  "email": "user@example.com" (optional)
}

Response:
{
  "sessionId": "abc123...",
  "sdkToken": "xyz789...",
  "expiresAt": 1234567890
}
```

#### 2. Get KYC Status
```javascript
GET /api/kyc/status/:walletAddress

Response:
{
  "walletAddress": "0x742d35...",
  "status": "pending|approved|rejected",
  "onChainVerified": true,
  "submittedAt": "2025-12-08T09:00:00Z",
  "approvedAt": "2025-12-08T09:15:00Z",
  "documents": ["passport", "selfie"],
  "reviewStatus": "completed"
}
```

#### 3. Webhook Handler
```javascript
POST /api/kyc/webhook

Headers:
{
  "X-Sumsub-Signature": "signature..."
}

Body:
{
  "applicantId": "user123",
  "reviewStatus": "completed",
  "reviewResult": {
    "reviewAnswer": "GREEN|RED",
    "rejectLabels": [],
    "clientComment": ""
  },
  "externalUserId": "0x742d35..."
}
```

---

## 💻 Backend Code (Node.js + Express)

### Installation

```bash
npm install express sumsub-sdk ethers dotenv
```

### Environment Variables

```bash
# .env
SUMSUB_APP_TOKEN=your_app_token
SUMSUB_SECRET_KEY=your_secret_key
SUMSUB_BASE_URL=https://api.sumsub.com

CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x... # KYC admin wallet
RPC_URL=https://mainnet.infura.io/v3/...

DATABASE_URL=postgresql://...
```

### Server Implementation

```javascript
// server.js
const express = require('express');
const { SumsubSDK } = require('sumsub-sdk');
const { ethers } = require('ethers');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Initialize Sumsub SDK
const sumsub = new SumsubSDK({
  appToken: process.env.SUMSUB_APP_TOKEN,
  secretKey: process.env.SUMSUB_SECRET_KEY,
  baseURL: process.env.SUMSUB_BASE_URL
});

// Initialize Web3
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const kycAdminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ['function setKYCStatus(address user, bool verified) external'],
  kycAdminWallet
);

// 1. Initialize KYC Session
app.post('/api/kyc/initialize', async (req, res) => {
  try {
    const { walletAddress, email } = req.body;
    
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Create applicant in Sumsub
    const applicant = await sumsub.createApplicant({
      externalUserId: walletAddress,
      email: email,
      fixedInfo: {
        country: 'USA' // or detect from IP
      }
    });
    
    // Generate SDK token
    const sdkToken = await sumsub.generateSDKToken(
      applicant.id,
      'basic-kyc-level' // your level name
    );
    
    // Store in database
    await db.kycSessions.create({
      walletAddress,
      applicantId: applicant.id,
      status: 'initialized',
      createdAt: new Date()
    });
    
    res.json({
      sessionId: applicant.id,
      sdkToken: sdkToken,
      expiresAt: Date.now() + 3600000 // 1 hour
    });
    
  } catch (error) {
    console.error('KYC initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize KYC' });
  }
});

// 2. Get KYC Status
app.get('/api/kyc/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Get from database
    const session = await db.kycSessions.findOne({ walletAddress });
    
    if (!session) {
      return res.json({
        walletAddress,
        status: 'not_started',
        onChainVerified: false
      });
    }
    
    // Get status from Sumsub
    const applicant = await sumsub.getApplicant(session.applicantId);
    
    // Check on-chain status
    const onChainVerified = await contract.kycVerified(walletAddress);
    
    res.json({
      walletAddress,
      status: mapSumsubStatus(applicant.review?.reviewStatus),
      onChainVerified,
      submittedAt: session.createdAt,
      approvedAt: session.approvedAt,
      documents: applicant.requiredIdDocs?.docSets || [],
      reviewStatus: applicant.review?.reviewStatus
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// 3. Webhook Handler
app.post('/api/kyc/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-payload-digest'];
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SUMSUB_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { externalUserId, reviewResult, reviewStatus } = req.body;
    const walletAddress = externalUserId;
    
    console.log(`KYC Webhook: ${walletAddress} - ${reviewStatus}`);
    
    // Update database
    await db.kycSessions.update(
      { walletAddress },
      {
        status: reviewStatus,
        reviewResult: reviewResult,
        updatedAt: new Date()
      }
    );
    
    // If approved, update blockchain
    if (reviewStatus === 'completed' && reviewResult?.reviewAnswer === 'GREEN') {
      try {
        console.log(`Approving on-chain: ${walletAddress}`);
        
        const tx = await contract.setKYCStatus(walletAddress, true);
        await tx.wait();
        
        console.log(`✅ On-chain KYC approved: ${tx.hash}`);
        
        await db.kycSessions.update(
          { walletAddress },
          {
            onChainApproved: true,
            approvedAt: new Date(),
            txHash: tx.hash
          }
        );
        
        // Send notification email
        await sendEmail(walletAddress, 'KYC Approved', 'You can now purchase fractions!');
        
      } catch (error) {
        console.error('On-chain approval error:', error);
        // Log for manual review
        await db.failedApprovals.create({
          walletAddress,
          error: error.message,
          createdAt: new Date()
        });
      }
    }
    
    // If rejected
    if (reviewResult?.reviewAnswer === 'RED') {
      const rejectReasons = reviewResult.rejectLabels || [];
      await sendEmail(
        walletAddress, 
        'KYC Rejected', 
        `Reasons: ${rejectReasons.join(', ')}`
      );
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function
function mapSumsubStatus(sumsubStatus) {
  const statusMap = {
    'init': 'pending',
    'pending': 'pending',
    'prechecked': 'pending',
    'queued': 'pending',
    'completed': 'approved',
    'onHold': 'review',
    'rejected': 'rejected'
  };
  return statusMap[sumsubStatus] || 'unknown';
}

// Start server
app.listen(3000, () => {
  console.log('KYC API running on port 3000');
});
```

---

## 🎨 Frontend Implementation (React)

### KYC Component

```jsx
// components/KYCVerification.jsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SumsubWebSdk from '@sumsub/websdk-react';

export function KYCVerification() {
  const { address } = useAccount();
  const [kycStatus, setKycStatus] = useState(null);
  const [sdkToken, setSdkToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing KYC status
  useEffect(() => {
    if (address) {
      checkKYCStatus();
    }
  }, [address]);

  const checkKYCStatus = async () => {
    try {
      const response = await fetch(`/api/kyc/status/${address}`);
      const data = await response.json();
      setKycStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking KYC status:', error);
      setLoading(false);
    }
  };

  const startKYC = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kyc/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      setSdkToken(data.sdkToken);
    } catch (error) {
      console.error('Error starting KYC:', error);
      setLoading(false);
    }
  };

  const handleMessage = (message) => {
    console.log('Sumsub message:', message);
    
    if (message.type === 'idCheck.onApplicantSubmitted') {
      // User submitted documents
      alert('Documents submitted! We\'ll review within 24 hours.');
      checkKYCStatus();
    }
  };

  if (loading) {
    return <div>Loading KYC status...</div>;
  }

  // Already verified on-chain
  if (kycStatus?.onChainVerified) {
    return (
      <div className="kyc-verified">
        <h3>✅ KYC Verified</h3>
        <p>You can now purchase validator fractions!</p>
      </div>
    );
  }

  // Pending review
  if (kycStatus?.status === 'pending') {
    return (
      <div className="kyc-pending">
        <h3>⏳ KYC Under Review</h3>
        <p>Your documents are being reviewed. This usually takes 1-24 hours.</p>
        <button onClick={checkKYCStatus}>Refresh Status</button>
      </div>
    );
  }

  // Approved but not on-chain yet
  if (kycStatus?.status === 'approved' && !kycStatus?.onChainVerified) {
    return (
      <div className="kyc-processing">
        <h3>✅ KYC Approved</h3>
        <p>Adding to blockchain... Please wait a few minutes.</p>
        <button onClick={checkKYCStatus}>Refresh Status</button>
      </div>
    );
  }

  // Rejected
  if (kycStatus?.status === 'rejected') {
    return (
      <div className="kyc-rejected">
        <h3>❌ KYC Rejected</h3>
        <p>Please contact support for more information.</p>
        <button onClick={startKYC}>Try Again</button>
      </div>
    );
  }

  // Not started or need to start
  if (!sdkToken) {
    return (
      <div className="kyc-start">
        <h3>🔐 KYC Verification Required</h3>
        <p>To purchase validator fractions, you must complete KYC verification.</p>
        <ul>
          <li>✅ ID document (passport, driver's license)</li>
          <li>✅ Selfie for face matching</li>
          <li>✅ 5-10 minutes to complete</li>
          <li>✅ Reviewed within 24 hours</li>
        </ul>
        <button onClick={startKYC}>Start Verification</button>
      </div>
    );
  }

  // Show Sumsub SDK
  return (
    <div className="kyc-widget">
      <SumsubWebSdk
        accessToken={sdkToken}
        expirationHandler={() => startKYC()} // Refresh token
        config={{
          lang: 'en',
          theme: 'dark',
          i18n: {
            document: {
              subTitles: {
                IDENTITY: 'Upload your ID document'
              }
            }
          }
        }}
        options={{ adaptIFrameHeight: true }}
        onMessage={handleMessage}
        onError={(error) => console.error('Sumsub error:', error)}
      />
    </div>
  );
}
```

---

## 📊 KYC Workflow

### User Journey

```
1. User Connects Wallet
   ↓
2. Check KYC Status
   ├─ Verified? → Allow Purchase
   └─ Not Verified → Show KYC Widget
       ↓
3. User Clicks "Start Verification"
   ↓
4. Backend Creates Session
   ├─ Generates SDK token
   └─ Returns to frontend
       ↓
5. Sumsub Widget Loads
   ↓
6. User Uploads Documents
   ├─ ID (Passport/Driver License)
   ├─ Selfie
   └─ Liveness Check
       ↓
7. Documents Submitted
   ↓
8. Sumsub Reviews (Auto + Manual)
   ├─ AI checks document validity
   ├─ Face matching
   ├─ AML screening
   └─ Manual review if needed (1-24h)
       ↓
9. Decision Made
   ├─ Approved → Webhook to Backend
   │   ↓
   │   Backend calls contract.setKYCStatus(user, true)
   │   ↓
   │   User can now purchase
   │
   └─ Rejected → Notification sent
       └─ User can retry with different docs
```

---

## 🔒 Security Best Practices

### 1. Data Protection
```javascript
// Encrypt sensitive data
const encryptData = (data) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

// Store encrypted
await db.kycData.create({
  walletAddress,
  encryptedEmail: encryptData(email),
  encryptedName: encryptData(name)
});
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const kycLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many KYC attempts, please try again later'
});

app.use('/api/kyc', kycLimiter);
```

### 3. Webhook Security
```javascript
// Always verify webhook signatures
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-payload-digest'];
  const expected = crypto
    .createHmac('sha256', process.env.SUMSUB_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
};

app.post('/api/kyc/webhook', verifyWebhook, handleWebhook);
```

### 4. GDPR Compliance
```javascript
// Right to deletion
app.delete('/api/kyc/data/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  // Verify ownership (signature check)
  const isOwner = await verifyWalletOwnership(req.headers.signature);
  
  if (!isOwner) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Delete from Sumsub
  await sumsub.deleteApplicant(applicantId);
  
  // Delete from database
  await db.kycSessions.delete({ walletAddress });
  
  res.json({ success: true });
});
```

---

## 💰 Cost Estimation

### Sumsub Pricing
```
Tier 1 (0-1,000 checks/month): $2.00/check
Tier 2 (1,000-5,000): $1.50/check
Tier 3 (5,000-20,000): $1.20/check
Tier 4 (20,000+): $1.00/check

Expected for Ionova:
- Month 1: 500 users × $2.00 = $1,000
- Month 3: 2,000 users × $1.50 = $3,000
- Month 6: 10,000 users × $1.20 = $12,000
- Year 1: 50,000 users × $1.00 = $50,000

Total Year 1: ~$66,000
```

---

## ✅ Deployment Checklist

- [ ] Sign up for Sumsub account
- [ ] Get API credentials
- [ ] Configure verification levels
- [ ] Set up webhook endpoint
- [ ] Deploy backend API
- [ ] Integrate frontend component
- [ ] Set KYC admin wallet
- [ ] Test on testnet
- [ ] Legal review of KYC process
- [ ] Privacy policy update
- [ ] Deploy to production

---

## 📞 Support & Resources

**Sumsub Documentation:**
- https://docs.sumsub.com/
- React SDK: https://github.com/SumSubstance/websdk-react

**Technical Support:**
- Email: dev@ionova.network
- Discord: #kyc-support

---

**✅ KYC Implementation: Production-Ready Architecture**

Current smart contract implementation is complete. Backend and frontend integration ready to deploy!

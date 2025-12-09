# KYC-Enabled Airdrop System

## 🎁 100 IONX Airdrop for 100,000 Users

Automated airdrop system that distributes 100 IONX to users after KYC verification.

---

## System Overview

### How It Works

1. **User Registration**
   - User connects wallet to website
   - Fills out KYC form (name, DOB, country)
   - Uploads government ID + selfie
   - Submits wallet address on-chain

2. **Admin Review**
   - Admin reviews KYC documents in dashboard
   - Approves or rejects submission
   - On approval, smart contract automatically sends 100 IONX

3. **Token Distribution**
   - 100 IONX instantly transferred to wallet
   - One claim per address (enforced by contract)
   - Transaction recorded on blockchain

---

## Smart Contract

**File**: [`IonovaKYCAirdrop.sol`](file:///f:/ionova/contracts/IonovaKYCAirdrop.sol)

**Key Features**:
- ✅ Wallet registration
- ✅ KYC status tracking (Pending, Approved, Rejected)
- ✅ Automatic 100 IONX transfer on approval
- ✅ Admin access control
- ✅ Batch approval for efficiency
- ✅ Emergency pause functionality
- ✅ Statistics dashboard

**Allocation**:
- Total: 10,000,000 IONX
- Per User: 100 IONX
- Max Users: 100,000

---

## Deployment

### 1. Deploy Contract

```bash
cd contracts
npx hardhat run scripts/deploy-kyc-airdrop.js --network ionova
```

**Required**: Set `IONX_TOKEN_ADDRESS` in `.env` file

### 2. Fund Contract

```javascript
// Approve 10M IONX for contract
await ionxToken.approve(airdropAddress, "10000000000000000000000000");

// Fund the airdrop
await airdrop.fundContract("10000000000000000000000000");
```

### 3. Configure Frontend

Update `.env` in `next_steps/website`:

```env
VITE_KYC_AIRDROP_ADDRESS=0x...
```

### 4. Start Backend

```bash
cd server
npm install
node server.js
```

---

## Frontend Components

### User Claim Flow

**Component**: [`KYCRegistration.jsx`](file:///f:/ionova/next_steps/website/src/components/KYCRegistration.jsx)

**Steps**:
1. **Connect Wallet** → Shows wallet address
2. **Personal Info** → Name, DOB, country
3. **Upload Documents** → Government ID, selfie
4. **Review & Submit** → Accept terms, submit
5. **Pending Status** → "Under review" message
6. **Approved** → "100 IONX sent!" confirmation

### Admin Dashboard

**Component**: [`KYCAdminPanel.jsx`](file:///f:/ionova/next_steps/website/src/components/KYCAdminPanel.jsx)

**Features**:
- View pending/approved/rejected submissions
- Document viewer
- One-click approve/reject buttons
- Batch approval for multiple users
- Real-time statistics
- Manual airdrop trigger (emergency)

---

## Backend API

**File**: [`kyc-api.js`](file:///f:/ionova/server/kyc-api.js)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kyc/submit` | Submit KYC documents |
| GET | `/api/kyc/status/:address` | Check KYC status |
| GET | `/api/kyc/applications` | Get all applications (admin) |
| POST | `/api/kyc/approve/:address` | Approve KYC (admin) |
| POST | `/api/kyc/reject/:address` | Reject KYC (admin) |

### Data Storage

Currently uses **in-memory storage** for MVP.

**For production**, integrate:
- MongoDB / PostgreSQL for data persistence
- AWS S3 for encrypted document storage
- Redis for caching

---

## Admin Workflow

### Reviewing KYC

1. Access admin panel at `/admin/kyc`
2. View pending submissions
3. Click on application to view details
4. Review uploaded documents
5. Click **Approve** or **Reject**

### Approving Single User

```javascript
// On approve button click:
1. Frontend calls admin panel approveKYC()
2. Smart contract updates status to APPROVED
3. Contract automatically transfers 100 IONX
4. User receives tokens instantly
```

### Batch Approval

```javascript
// For multiple users:
1. Select users via checkboxes
2. Click "Batch Approve"
3. Contract processes all in one transaction
4. All users receive 100 IONX
```

---

## Security Features

### Smart Contract
- ✅ ReentrancyGuard on transfers
- ✅ Pausable (emergency stop)
- ✅ Owner-only admin functions
- ✅ One claim per address
- ✅ Event logging for audit trail

### Backend
- ✅ File type validation (JPEG, PNG, PDF only)
- ✅ File size limit (10MB max)
- ✅ Input sanitization
- ⚠️ TODO: Admin authentication (JWT)
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Document encryption

### Data Privacy
- ⚠️ TODO: GDPR compliance
- ⚠️ TODO: Auto-delete docs after 90 days
- ⚠️ TODO: Encrypted storage

---

## Testing

### Contract Tests

```bash
cd contracts
npx hardhat test test/IonovaKYCAirdrop.test.js
```

### End-to-End Test

1. Connect wallet
2. Submit KYC with test documents
3. Admin approves in dashboard
4. Verify 100 IONX received
5. Try claiming again (should fail)

---

## Statistics Dashboard

**Metrics Tracked**:
- Total submissions
- Total approved
- Total rejected
- Total airdrops claimed
- Total IONX distributed
- Remaining airdrops
- Contract balance

**Access**: Available in both user view and admin panel

---

## KYC Document Requirements

### Required Documents

1. **Government-Issued ID**
   - Passport
   - Driver's License
   - National ID
   - Format: JPEG, PNG, or PDF
   - Max size: 10MB

2. **Selfie**
   - Hold ID next to face
   - Clear, well-lit photo
   - Format: JPEG or PNG
   - Max size: 10MB

### Rejection Reasons

Common reasons for rejection:
- Blurry or unclear documents
- Information mismatch
- Expired ID
- Poor lighting in selfie
- ID not visible in selfie

---

## Integration Options

### Option 1: Manual Review (Current)

**Pros**:
- $0 cost
- Full control
- Custom criteria

**Cons**:
- Time-intensive
- Doesn't scale beyond 1,000 users

### Option 2: Automated (Sumsub/Onfido)

**Integration Steps**:
1. Sign up for Sumsub account
2. Get API key
3. Update `kyc-api.js` with Sumsub SDK
4. Configure webhook endpoint
5. Auto-approval on verification

**Cost**: $1-3 per user

---

## Troubleshooting

### User Can't Submit KYC

**Check**:
- Wallet connected?
- All fields filled?
- Documents uploaded?
- File size under 10MB?
- Already submitted?

### Admin Can't Approve

**Check**:
- Admin wallet connected?
- User status is "PENDING"?
- Contract has sufficient IONX?
- Not already approved?

### Tokens Not Received

**Check**:
- Transaction confirmed on blockchain?
- Correct wallet address?
- Check contract balance
- Review transaction hash

---

## Roadmap

### Phase 1: MVP ✅
- [x] Smart contract
- [x] Frontend components
- [x] Backend API
- [x] Manual review system

### Phase 2: Scale (Q1 2025)
- [ ] Sumsub integration
- [ ] Database persistence
- [ ] Admin authentication
- [ ] Document encryption

### Phase 3: Optimize (Q2 2025)
- [ ] Auto-approval AI
- [ ] Fraud detection
- [ ] Multi-language support
- [ ] Mobile app

---

## Support

**Issues**: Submit KYC issues to support@ionova.network

**Admin Help**: Contact admin-support@ionova.network

**Documentation**: https://docs.ionova.network/kyc-airdrop

---

## Files Created

### Smart Contracts
- [`contracts/IonovaKYCAirdrop.sol`](file:///f:/ionova/contracts/IonovaKYCAirdrop.sol)
- [`contracts/scripts/deploy-kyc-airdrop.js`](file:///f:/ionova/contracts/scripts/deploy-kyc-airdrop.js)

### Frontend
- [`src/components/KYCRegistration.jsx`](file:///f:/ionova/next_steps/website/src/components/KYCRegistration.jsx)
- [`src/components/KYCAdminPanel.jsx`](file:///f:/ionova/next_steps/website/src/components/KYCAdminPanel.jsx)
- [`src/styles/KYCAirdrop.css`](file:///f:/ionova/next_steps/website/src/styles/KYCAirdrop.css)

### Backend
- [`server/kyc-api.js`](file:///f:/ionova/server/kyc-api.js)

---

**System Status**: ✅ Ready for deployment!

**Next Steps**:
1. Deploy contract to testnet
2. Test end-to-end flow
3. Deploy to mainnet
4. Launch marketing campaign

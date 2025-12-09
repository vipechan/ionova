# Ionova Airdrop Eligibility Requirements

## 📋 Overview

To claim the 50 IONX base airdrop, users **MUST** complete **ALL** of the following social media tasks:

## ✅ Required Tasks (7 Total)

### 1. YouTube
- ✅ Subscribe to Ionova Network channel
- Link: https://youtube.com/@ionova

### 2. Twitter (3 Tasks)
- ✅ Follow @IonovaNetwork
- ✅ Like the pinned announcement tweet
- ✅ Retweet the pinned post and tag 3 friends

### 3. Telegram (2 Tasks)
- ✅ Join Ionova announcement channel
- ✅ Join Ionova community discussion group
- Links: 
  - Channel: https://t.me/ionova_channel
  - Group: https://t.me/ionova

### 4. Facebook
- ✅ Follow/Like Ionova Network Facebook page
- Link: https://facebook.com/ionova

---

## 🎁 Rewards

### Base Airdrop
- **50 IONX** per wallet
- **One-time claim** only
- Requires completion of **ALL 7 tasks**

### Referral Bonus (Optional)
- **12.5 IONX** for each person who:
  1. Uses your referral link
  2. Connects their wallet
  3. Completes all 7 tasks
  4. Claims their 50 IONX

**Unlimited referrals** - earn 12.5 IONX per successful referral!

---

## 📝 Verification Process

### Step 1: Connect Wallet
- User enters or connects their wallet address

### Step 2: Complete ALL Tasks
- User completes all 7 social media tasks
- UI tracks completion (self-declaration)
- Progress bar shows 0/7 to 7/7

### Step 3: Submit for Verification
- Submit button is **LOCKED** until all 7 tasks marked complete
- User submits wallet + social handles for review

### Step 4: Manual Verification
- Admin manually verifies each completed task:
  - YouTube subscription
  - Twitter follow
  - Twitter like on pinned post
  - Twitter retweet with 3 friend tags
  - Telegram channel membership
  - Telegram group membership
  - Facebook page follow

### Step 5: Approval & Distribution
- Once verified, 50 IONX is sent to user's wallet
- User receives referral link to share
- Each successful referral earns 12.5 IONX instantly

---

## 🚫 Restrictions

### Anti-Fraud Measures
- ✅ One claim per wallet address
- ✅ Manual admin verification prevents bots
- ✅ Referrer must have claimed airdrop first
- ✅ Cannot refer yourself
- ✅ All tasks must be genuinely completed

### Disqualification
Users will be disqualified if:
- Tasks are not genuinely completed
- Fake accounts used
- Bot/automated activity detected
- Attempting to game the system

---

## 💡 Task Checklist UI

The airdrop page features:

### Interactive Task List
```
[ ] YouTube - Subscribe
[ ] Twitter - Follow @IonovaNetwork
[ ] Twitter - Like pinned tweet
[ ] Twitter - Retweet + tag 3 friends
[ ] Telegram - Join channel
[ ] Telegram - Join group
[ ] Facebook - Follow page
```

### Progress Tracker
- Visual progress bar: `[████░░░] 4/7 Complete`
- Tasks Completed counter
- Submit button locked until 7/7 complete

### Status Indicators
- ⏳ Pending: Task not started
- ✓ Done: Task marked complete
- 🔒 Locked: Submit button disabled
- ✅ All Complete: Submit button enabled

---

## 🔄 Workflow

```
1. User visits airdrop page
   ↓
2. Enters wallet address
   ↓
3. Sees list of 7 required tasks
   ↓
4. Completes each task externally
   ↓
5. Marks each task as "Done" in UI
   ↓
6. Progress bar fills to 7/7
   ↓
7. "Submit for Verification" button unlocks
   ↓
8. User submits for admin review
   ↓
9. Admin manually verifies all 7 tasks
   ↓
10. Admin approves → 50 IONX sent
   ↓
11. User receives referral link
   ↓
12. Earns 12.5 IONX per successful referral
```

---

## 📊 Budget Impact

### Base Airdrop Pool
- Target: 1,000 users
- Cost: 1,000 × 50 IONX = **50,000 IONX**

### Referral Bonus Pool
- **Unlimited** - paid from treasury
- Average 2 referrals per user = 25,000 IONX additional
- Maximum theoretical: Unlimited

### Total Estimated Cost
- Base: 50,000 IONX
- Referrals (avg): 25,000 IONX
- **Total: ~75,000 IONX**

---

## ✅ Benefits of This Model

### For Ionova
1. **Genuine Community Growth** - Real followers across all platforms
2. **Anti-Bot Protection** - Manual verification prevents automated claims
3. **Viral Marketing** - Referral system incentivizes sharing
4. **Multi-Platform Presence** - Builds audience on 5+ platforms
5. **Cost Effective** - 50% lower base cost than 100 IONX model

### For Users
1. **Fair Reward** - 50 IONX for real engagement
2. **Unlimited Earning** - 12.5 IONX per referral
3. **Simple Process** - Clear 7-step checklist
4. **Transparency** - Know exactly what's required

---

## 🛠️ Implementation

### Frontend (Airdrop.jsx)
- Task checklist with 7 items
- Progress tracker
- Locked submit button until all complete
- Responsive mobile design

### Smart Contract (IonovaAirdrop.sol)
- `claimAirdrop(address _referrer)` function
- `hasClaimedAirdrop(address)` checking
- `referralCount` tracking
- `getTotalEarned()` for transparency

### Admin Panel
- List of pending submissions
- User wallet + social handles
- Checkboxes for manual verification
- Approve/Reject buttons
- Bulk distribution tool

---

## 📞 Support

If users have issues:
- Check FAQ section
- Contact support with wallet address
- Allow 24-48 hours for manual verification
- Join Telegram for updates

---

**Airdrop Status:** Active  
**Last Updated:** December 9, 2025  
**Total Distributed:** TBD  
**Pending Verification:** TBD

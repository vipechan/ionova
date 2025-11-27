const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// Configure file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/kyc');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const hash = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${hash}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
        }
    }
});

// In-memory database (replace with actual database in production)
// For production, use MongoDB, PostgreSQL, or similar
const kycDatabase = new Map();

/**
 * @route POST /api/kyc/submit
 * @desc Submit KYC documents and information
 */
router.post('/submit', upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const { walletAddress, fullName, dateOfBirth, country } = req.body;

        // Validation
        if (!walletAddress || !fullName || !dateOfBirth || !country) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!req.files.idDocument || !req.files.selfie) {
            return res.status(400).json({ error: 'Missing required documents' });
        }

        // Check if already submitted
        if (kycDatabase.has(walletAddress.toLowerCase())) {
            const existing = kycDatabase.get(walletAddress.toLowerCase());
            if (existing.kycStatus !== 'rejected') {
                return res.status(400).json({ error: 'KYC already submitted for this address' });
            }
        }

        // Store KYC data
        const kycData = {
            walletAddress: walletAddress.toLowerCase(),
            fullName,
            dateOfBirth,
            country,
            kycStatus: 'pending',
            submittedAt: new Date().toISOString(),
            approvedAt: null,
            kycProvider: 'manual',
            kycReferenceId: crypto.randomBytes(16).toString('hex'),
            documents: [
                {
                    type: 'Government ID',
                    url: `/uploads/kyc/${req.files.idDocument[0].filename}`,
                    filename: req.files.idDocument[0].filename
                },
                {
                    type: 'Selfie',
                    url: `/uploads/kyc/${req.files.selfie[0].filename}`,
                    filename: req.files.selfie[0].filename
                }
            ],
            rejectionReason: '',
            airdropClaimed: false
        };

        kycDatabase.set(walletAddress.toLowerCase(), kycData);

        res.json({
            success: true,
            message: 'KYC submitted successfully',
            referenceId: kycData.kycReferenceId
        });
    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({ error: 'Failed to submit KYC' });
    }
});

/**
 * @route GET /api/kyc/status/:address
 * @desc Get KYC status for a wallet address
 */
router.get('/status/:address', (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const kycData = kycDatabase.get(address);

        if (!kycData) {
            return res.json({
                status: 'not_submitted',
                message: 'No KYC submission found'
            });
        }

        res.json({
            status: kycData.kycStatus,
            submittedAt: kycData.submittedAt,
            approvedAt: kycData.approvedAt,
            rejectionReason: kycData.rejectionReason,
            airdropClaimed: kycData.airdropClaimed
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

/**
 * @route GET /api/kyc/applications
 * @desc Get all KYC applications (Admin only)
 * @query status - Filter by status (pending, approved, rejected)
 */
router.get('/applications', (req, res) => {
    try {
        // TODO: Add authentication middleware to verify admin
        const { status } = req.query;

        let applications = Array.from(kycDatabase.values());

        if (status) {
            applications = applications.filter(app => app.kycStatus === status);
        }

        res.json(applications);
    } catch (error) {
        console.error('Failed to fetch applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

/**
 * @route POST /api/kyc/approve/:address
 * @desc Approve KYC (Admin only)
 */
router.post('/approve/:address', async (req, res) => {
    try {
        // TODO: Add authentication middleware to verify admin
        const address = req.params.address.toLowerCase();
        const kycData = kycDatabase.get(address);

        if (!kycData) {
            return res.status(404).json({ error: 'KYC application not found' });
        }

        if (kycData.kycStatus !== 'pending') {
            return res.status(400).json({ error: 'KYC is not pending approval' });
        }

        // Update status
        kycData.kycStatus = 'approved';
        kycData.approvedAt = new Date().toISOString();
        kycDatabase.set(address, kycData);

        // NOTE: The actual token transfer is handled by the smart contract
        // when admin calls approveKYC() function on-chain

        res.json({
            success: true,
            message: 'KYC approved successfully'
        });
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ error: 'Failed to approve KYC' });
    }
});

/**
 * @route POST /api/kyc/reject/:address
 * @desc Reject KYC (Admin only)
 */
router.post('/reject/:address', async (req, res) => {
    try {
        // TODO: Add authentication middleware to verify admin
        const address = req.params.address.toLowerCase();
        const { reason } = req.body;
        const kycData = kycDatabase.get(address);

        if (!kycData) {
            return res.status(404).json({ error: 'KYC application not found' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason required' });
        }

        // Update status
        kycData.kycStatus = 'rejected';
        kycData.rejectionReason = reason;
        kycDatabase.set(address, kycData);

        res.json({
            success: true,
            message: 'KYC rejected successfully'
        });
    } catch (error) {
        console.error('Rejection error:', error);
        res.status(500).json({ error: 'Failed to reject KYC' });
    }
});

/**
 * @route POST /api/kyc/webhook
 * @desc Webhook for third-party KYC providers (e.g., Sumsub)
 */
router.post('/webhook', async (req, res) => {
    try {
        // TODO: Verify webhook signature
        const { applicantId, reviewStatus, walletAddress } = req.body;

        const address = walletAddress?.toLowerCase();
        if (!address || !kycDatabase.has(address)) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const kycData = kycDatabase.get(address);

        // Update based on provider response
        if (reviewStatus === 'completed') {
            kycData.kycStatus = 'approved';
            kycData.approvedAt = new Date().toISOString();
        } else if (reviewStatus === 'rejected') {
            kycData.kycStatus = 'rejected';
            kycData.rejectionReason = 'Failed automated verification';
        }

        kycDatabase.set(address, kycData);

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Export database for persistence (optional)
 */
router.get('/export', (req, res) => {
    // TODO: Add admin authentication
    const data = Array.from(kycDatabase.entries());
    res.json(data);
});

/**
 * Import database (optional)
 */
router.post('/import', (req, res) => {
    // TODO: Add admin authentication
    try {
        const { data } = req.body;
        data.forEach(([key, value]) => {
            kycDatabase.set(key, value);
        });
        res.json({ success: true, imported: data.length });
    } catch (error) {
        res.status(500).json({ error: 'Import failed' });
    }
});

module.exports = router;

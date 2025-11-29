import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import '../styles/KYCAirdrop.css';

const KYC_AIRDROP_ABI = [
    {
        "inputs": [],
        "name": "registerWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getUserData",
        "outputs": [
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "uint256", "name": "submittedAt", "type": "uint256" },
            { "internalType": "uint256", "name": "approvedAt", "type": "uint256" },
            { "internalType": "bool", "name": "airdropClaimed", "type": "bool" },
            { "internalType": "string", "name": "rejectionReason", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getStatistics",
        "outputs": [
            { "internalType": "uint256", "name": "_totalSubmissions", "type": "uint256" },
            { "internalType": "uint256", "name": "_totalApproved", "type": "uint256" },
            { "internalType": "uint256", "name": "_totalRejected", "type": "uint256" },
            { "internalType": "uint256", "name": "_totalAirdropsClaimed", "type": "uint256" },
            { "internalType": "uint256", "name": "_totalTokensDistributed", "type": "uint256" },
            { "internalType": "uint256", "name": "_remainingAirdrops", "type": "uint256" },
            { "internalType": "uint256", "name": "_contractBalance", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const KYC_AIRDROP_ADDRESS = import.meta.env.VITE_KYC_AIRDROP_ADDRESS;

const KYC_STATUS = {
    0: 'NOT_SUBMITTED',
    1: 'PENDING',
    2: 'APPROVED',
    3: 'REJECTED'
};

export default function KYCRegistration() {
    const { address, isConnected } = useAccount();
    const [kycStep, setKycStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        country: '',
        idDocument: null,
        selfie: null,
        termsAccepted: false
    });
    const [uploading, setUploading] = useState(false);

    // Get user KYC status from contract
    const { data: userData, refetch: refetchUserData } = useReadContract({
        address: KYC_AIRDROP_ADDRESS,
        abi: KYC_AIRDROP_ABI,
        functionName: 'getUserData',
        args: [address],
        query: {
            enabled: !!address,
        },
    });

    // Get contract statistics
    const { data: stats } = useReadContract({
        address: KYC_AIRDROP_ADDRESS,
        abi: KYC_AIRDROP_ABI,
        functionName: 'getStatistics',
    });

    // Register wallet on-chain
    const { writeContract: registerWalletWrite, data: registerTxHash, isPending: isRegistering } = useWriteContract();

    const registerWallet = () => {
        registerWalletWrite({
            address: KYC_AIRDROP_ADDRESS,
            abi: KYC_AIRDROP_ABI,
            functionName: 'registerWallet'
        });
    };

    const { isLoading: isWaiting, isSuccess: registerSuccess } = useWaitForTransactionReceipt({
        hash: registerTxHash
    });

    useEffect(() => {
        if (registerSuccess) {
            refetchUserData();
        }
    }, [registerSuccess, refetchUserData]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        }
    };

    const handleSubmitKYC = async () => {
        setUploading(true);

        try {
            // Upload documents to backend
            const formDataToSend = new FormData();
            formDataToSend.append('walletAddress', address);
            formDataToSend.append('fullName', formData.fullName);
            formDataToSend.append('dateOfBirth', formData.dateOfBirth);
            formDataToSend.append('country', formData.country);
            formDataToSend.append('idDocument', formData.idDocument);
            formDataToSend.append('selfie', formData.selfie);

            const response = await fetch('/api/kyc/submit', {
                method: 'POST',
                body: formDataToSend
            });

            if (!response.ok) throw new Error('Upload failed');

            // Register wallet on-chain
            registerWallet();

        } catch (error) {
            console.error('KYC submission error:', error);
            alert('Failed to submit KYC. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="kyc-container">
                <div className="kyc-card">
                    <div className="kyc-header">
                        <h2>🎁 Claim 100 IONX Airdrop</h2>
                        <p>Complete KYC to receive your tokens</p>
                    </div>
                    <div className="connect-prompt">
                        <div className="icon">🔐</div>
                        <h3>Connect Your Wallet</h3>
                        <p>Please connect your wallet to start the KYC process</p>
                        <button className="btn btn-primary">Connect Wallet</button>
                    </div>
                </div>
            </div>
        );
    }

    // Show status if already submitted
    if (userData && userData[0] > 0) {
        const status = KYC_STATUS[userData[0]];

        return (
            <div className="kyc-container">
                <div className="kyc-card">
                    <div className="kyc-header">
                        <h2>🎁 100 IONX Airdrop Status</h2>
                        <p>Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>

                    {status === 'PENDING' && (
                        <div className="status-pending">
                            <div className="status-icon">🟡</div>
                            <h3>KYC Under Review</h3>
                            <p>Your KYC submission is being reviewed by our team.</p>
                            <div className="timeline">
                                <div className="timeline-item completed">
                                    <div className="dot"></div>
                                    <div className="content">
                                        <h4>Documents Submitted</h4>
                                        <p>✅ Completed</p>
                                    </div>
                                </div>
                                <div className="timeline-item active">
                                    <div className="dot"></div>
                                    <div className="content">
                                        <h4>Admin Review</h4>
                                        <p>⏳ In Progress</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="dot"></div>
                                    <div className="content">
                                        <h4>Airdrop Claim</h4>
                                        <p>⏸️ Pending</p>
                                    </div>
                                </div>
                            </div>
                            <div className="info-box">
                                <p><strong>Estimated time:</strong> 24-48 hours</p>
                                <p><strong>Need help?</strong> Contact support@ionova.network</p>
                            </div>
                        </div>
                    )}

                    {status === 'APPROVED' && userData[3] && (
                        <div className="status-approved">
                            <div className="status-icon success">🎉</div>
                            <h3>Congratulations!</h3>
                            <p className="success-message">Your KYC has been approved and 100 IONX has been sent to your wallet!</p>
                            <div className="airdrop-details">
                                <div className="detail-row">
                                    <span>Amount Received:</span>
                                    <strong>100 IONX</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Wallet:</span>
                                    <strong>{address?.slice(0, 10)}...{address?.slice(-8)}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Approved At:</span>
                                    <strong>{new Date(Number(userData[2]) * 1000).toLocaleString()}</strong>
                                </div>
                            </div>
                            <div className="action-buttons">
                                <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>
                                    View Dashboard
                                </button>
                                <button className="btn btn-primary" onClick={() => window.location.href = '/stake'}>
                                    Stake IONX
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'REJECTED' && (
                        <div className="status-rejected">
                            <div className="status-icon error">🔴</div>
                            <h3>KYC Rejected</h3>
                            <p>Your KYC submission was not approved.</p>
                            <div className="rejection-reason">
                                <h4>Reason:</h4>
                                <p>{userData[4] || 'No reason provided'}</p>
                            </div>
                            <div className="info-box warning">
                                <p>You can resubmit your KYC with corrected documents. Please ensure:</p>
                                <ul>
                                    <li>Documents are clear and readable</li>
                                    <li>All information matches</li>
                                    <li>Photos are well-lit and in focus</li>
                                </ul>
                            </div>
                            <button className="btn btn-primary" onClick={() => window.location.reload()}>
                                Resubmit KYC
                            </button>
                        </div>
                    )}
                </div>

                {/* Statistics Footer */}
                {stats && (
                    <div className="stats-footer">
                        <div className="stat-item">
                            <div className="stat-value">{stats[3]?.toString()}</div>
                            <div className="stat-label">Total Airdrops Claimed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats[5]?.toString()}</div>
                            <div className="stat-label">Remaining Airdrops</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // KYC Form Steps
    return (
        <div className="kyc-container">
            <div className="kyc-card">
                <div className="kyc-header">
                    <h2>🎁 Claim Your 100 IONX</h2>
                    <p>Complete KYC verification to receive your airdrop</p>
                </div>

                <div className="steps-indicator">
                    <div className={`step ${kycStep >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Personal Info</div>
                    </div>
                    <div className={`step ${kycStep >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Documents</div>
                    </div>
                    <div className={`step ${kycStep >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <div className="step-label">Review</div>
                    </div>
                </div>

                <div className="kyc-form">
                    {kycStep === 1 && (
                        <div className="form-step">
                            <h3>Personal Information</h3>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth *</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Country *</label>
                                <select name="country" value={formData.country} onChange={handleInputChange} required>
                                    <option value="">Select Country</option>
                                    <option value="US">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="IN">India</option>
                                    <option value="CA">Canada</option>
                                    <option value="AU">Australia</option>
                                    {/* Add more countries */}
                                </select>
                            </div>
                            <button
                                className="btn btn-primary btn-next"
                                onClick={() => setKycStep(2)}
                                disabled={!formData.fullName || !formData.dateOfBirth || !formData.country}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {kycStep === 2 && (
                        <div className="form-step">
                            <h3>Upload Documents</h3>
                            <div className="form-group">
                                <label>Government ID *</label>
                                <input
                                    type="file"
                                    name="idDocument"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    required
                                />
                                <p className="help-text">Passport, Driver's License, or National ID</p>
                            </div>
                            <div className="form-group">
                                <label>Selfie *</label>
                                <input
                                    type="file"
                                    name="selfie"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    required
                                />
                                <p className="help-text">Hold your ID next to your face</p>
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-outline" onClick={() => setKycStep(1)}>
                                    ← Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setKycStep(3)}
                                    disabled={!formData.idDocument || !formData.selfie}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {kycStep === 3 && (
                        <div className="form-step">
                            <h3>Review & Submit</h3>
                            <div className="review-section">
                                <div className="review-item">
                                    <span>Full Name:</span>
                                    <strong>{formData.fullName}</strong>
                                </div>
                                <div className="review-item">
                                    <span>Date of Birth:</span>
                                    <strong>{formData.dateOfBirth}</strong>
                                </div>
                                <div className="review-item">
                                    <span>Country:</span>
                                    <strong>{formData.country}</strong>
                                </div>
                                <div className="review-item">
                                    <span>Wallet:</span>
                                    <strong>{address?.slice(0, 10)}...{address?.slice(-8)}</strong>
                                </div>
                                <div className="review-item">
                                    <span>Documents:</span>
                                    <strong>✅ ID & Selfie uploaded</strong>
                                </div>
                            </div>

                            <div className="terms-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="termsAccepted"
                                        checked={formData.termsAccepted}
                                        onChange={handleInputChange}
                                    />
                                    <span>I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-outline" onClick={() => setKycStep(2)}>
                                    ← Back
                                </button>
                                <button
                                    className="btn btn-primary btn-submit"
                                    onClick={handleSubmitKYC}
                                    disabled={!formData.termsAccepted || uploading || isRegistering || isWaiting}
                                >
                                    {uploading || isRegistering || isWaiting ? (
                                        <>
                                            <span className="spinner"></span> Submitting...
                                        </>
                                    ) : (
                                        '🚀 Submit KYC'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
                <div className="banner-icon">💡</div>
                <div className="banner-content">
                    <h4>Why KYC?</h4>
                    <p>KYC helps us prevent fraud and ensure fair distribution of airdrops to real users.</p>
                </div>
            </div>
        </div>
    );
}

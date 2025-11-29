import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import '../styles/KYCAirdrop.css';

const KYC_AIRDROP_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "approveKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "string", "name": "reason", "type": "string" }
        ],
        "name": "rejectKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address[]", "name": "usersToApprove", "type": "address[]" }],
        "name": "batchApproveKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
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
    }
];

const KYC_AIRDROP_ADDRESS = import.meta.env.VITE_KYC_AIRDROP_ADDRESS;

export default function KYCAdminPanel() {
    const { address, isConnected } = useAccount();
    const [pendingApplications, setPendingApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [viewMode, setViewMode] = useState('pending'); // pending, approved, rejected

    // Get contract statistics
    const { data: stats, refetch: refetchStats } = useReadContract({
        address: KYC_AIRDROP_ADDRESS,
        abi: KYC_AIRDROP_ABI,
        functionName: 'getStatistics',
    });

    // Approve KYC
    const { writeContract: approveKYCWrite, data: approveTxHash, isPending: isApproving } = useWriteContract();

    const approveKYC = ({ args }) => {
        approveKYCWrite({
            address: KYC_AIRDROP_ADDRESS,
            abi: KYC_AIRDROP_ABI,
            functionName: 'approveKYC',
            args
        });
    };

    const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
        hash: approveTxHash
    });

    // Reject KYC
    const { writeContract: rejectKYCWrite, data: rejectTxHash, isPending: isRejecting } = useWriteContract();

    const rejectKYC = ({ args }) => {
        rejectKYCWrite({
            address: KYC_AIRDROP_ADDRESS,
            abi: KYC_AIRDROP_ABI,
            functionName: 'rejectKYC',
            args
        });
    };

    const { isSuccess: rejectSuccess } = useWaitForTransactionReceipt({
        hash: rejectTxHash
    });

    // Batch approve
    const { writeContract: batchApproveWrite, data: batchTxHash, isPending: isBatchApproving } = useWriteContract();

    const batchApprove = ({ args }) => {
        batchApproveWrite({
            address: KYC_AIRDROP_ADDRESS,
            abi: KYC_AIRDROP_ABI,
            functionName: 'batchApproveKYC',
            args
        });
    };

    const { isSuccess: batchSuccess } = useWaitForTransactionReceipt({
        hash: batchTxHash
    });

    // Fetch pending applications from backend
    useEffect(() => {
        fetchApplications();
    }, [viewMode]);

    useEffect(() => {
        if (approveSuccess || rejectSuccess || batchSuccess) {
            fetchApplications();
            refetchStats();
            setSelectedApplication(null);
        }
    }, [approveSuccess, rejectSuccess, batchSuccess]);

    const fetchApplications = async () => {
        try {
            const response = await fetch(`/api/kyc/applications?status=${viewMode}`);
            const data = await response.json();
            setPendingApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        }
    };

    const handleApprove = (userAddress) => {
        if (confirm(`Approve KYC for ${userAddress}? This will automatically send 100 IONX to their wallet.`)) {
            approveKYC({ args: [userAddress] });
        }
    };

    const handleReject = (userAddress) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        if (confirm(`Reject KYC for ${userAddress}?`)) {
            rejectKYC({ args: [userAddress, rejectionReason] });
            setRejectionReason('');
        }
    };

    const handleBatchApprove = () => {
        const addresses = pendingApplications
            .filter(app => app.selected)
            .map(app => app.walletAddress);

        if (addresses.length === 0) {
            alert('Please select at least one application');
            return;
        }

        if (confirm(`Batch approve ${addresses.length} applications? This will send ${addresses.length * 100} IONX total.`)) {
            batchApprove({ args: [addresses] });
        }
    };

    const toggleSelection = (address) => {
        setPendingApplications(prev =>
            prev.map(app =>
                app.walletAddress === address ? { ...app, selected: !app.selected } : app
            )
        );
    };

    if (!isConnected) {
        return (
            <div className="admin-panel">
                <div className="admin-card">
                    <h2>🔐 Admin Access Required</h2>
                    <p>Please connect your admin wallet to access the KYC management panel</p>
                    <button className="btn btn-primary">Connect Wallet</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            {/* Header */}
            <div className="admin-header">
                <h1>🛡️ KYC Admin Dashboard</h1>
                <p>Manage KYC verifications and airdrop distributions</p>
            </div>

            {/* Statistics Dashboard */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats[0]?.toString()}</div>
                            <div className="stat-label">Total Submissions</div>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats[1]?.toString()}</div>
                            <div className="stat-label">Approved</div>
                        </div>
                    </div>
                    <div className="stat-card danger">
                        <div className="stat-icon">❌</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats[2]?.toString()}</div>
                            <div className="stat-label">Rejected</div>
                        </div>
                    </div>
                    <div className="stat-card primary">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats[3]?.toString()}</div>
                            <div className="stat-label">Airdrops Claimed</div>
                        </div>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-icon">🎁</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats[5]?.toString()}</div>
                            <div className="stat-label">Remaining Airdrops</div>
                        </div>
                    </div>
                    <div className="stat-card info">
                        <div className="stat-icon">🏦</div>
                        <div className="stat-content">
                            <div className="stat-value">{formatEther(stats[6] || 0n)}</div>
                            <div className="stat-label">Contract Balance (IONX)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Tabs */}
            <div className="view-tabs">
                <button
                    className={`tab ${viewMode === 'pending' ? 'active' : ''}`}
                    onClick={() => setViewMode('pending')}
                >
                    🟡 Pending ({pendingApplications.filter(a => !a.selected).length})
                </button>
                <button
                    className={`tab ${viewMode === 'approved' ? 'active' : ''}`}
                    onClick={() => setViewMode('approved')}
                >
                    🟢 Approved
                </button>
                <button
                    className={`tab ${viewMode === 'rejected' ? 'active' : ''}`}
                    onClick={() => setViewMode('rejected')}
                >
                    🔴 Rejected
                </button>
            </div>

            {/* Batch Actions */}
            {viewMode === 'pending' && pendingApplications.some(app => app.selected) && (
                <div className="batch-actions">
                    <button
                        className="btn btn-success"
                        onClick={handleBatchApprove}
                        disabled={isBatchApproving}
                    >
                        {isBatchApproving ? '⏳ Processing...' : `✅ Batch Approve (${pendingApplications.filter(a => a.selected).length})`}
                    </button>
                </div>
            )}

            {/* Applications List */}
            <div className="applications-container">
                {pendingApplications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No {viewMode} applications</h3>
                        <p>There are currently no KYC applications in this category</p>
                    </div>
                ) : (
                    <div className="applications-grid">
                        {pendingApplications.map((app) => (
                            <div key={app.walletAddress} className={`application-card ${selectedApplication?.walletAddress === app.walletAddress ? 'selected' : ''}`}>
                                {viewMode === 'pending' && (
                                    <div className="selection-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={app.selected || false}
                                            onChange={() => toggleSelection(app.walletAddress)}
                                        />
                                    </div>
                                )}

                                <div className="app-header" onClick={() => setSelectedApplication(app)}>
                                    <div className="app-user">
                                        <div className="user-avatar">👤</div>
                                        <div className="user-info">
                                            <h4>{app.fullName}</h4>
                                            <p className="address">{app.walletAddress}</p>
                                        </div>
                                    </div>
                                    <div className="app-date">
                                        {new Date(app.submittedAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="app-details">
                                    <div className="detail-row">
                                        <span>Date of Birth:</span>
                                        <strong>{app.dateOfBirth}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Country:</span>
                                        <strong>{app.country}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Submitted:</span>
                                        <strong>{new Date(app.submittedAt).toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div className="app-documents">
                                    <h5>Documents:</h5>
                                    <div className="doc-previews">
                                        {app.documents?.map((doc, idx) => (
                                            <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-preview">
                                                <div className="doc-icon">📄</div>
                                                <div className="doc-name">{doc.type}</div>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {viewMode === 'pending' && (
                                    <div className="app-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleApprove(app.walletAddress)}
                                            disabled={isApproving}
                                        >
                                            {isApproving ? '⏳' : '✅'} Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => {
                                                setSelectedApplication(app);
                                                const reason = prompt('Rejection reason:');
                                                if (reason) {
                                                    setRejectionReason(reason);
                                                    handleReject(app.walletAddress);
                                                }
                                            }}
                                            disabled={isRejecting}
                                        >
                                            {isRejecting ? '⏳' : '❌'} Reject
                                        </button>
                                    </div>
                                )}

                                {viewMode === 'rejected' && app.rejectionReason && (
                                    <div className="rejection-info">
                                        <strong>Reason:</strong> {app.rejectionReason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

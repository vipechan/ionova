import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

const AIRDROP_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "airdropId", "type": "uint256" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "bytes32[]", "name": "merkleProof", "type": "bytes32[]" }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getActiveAirdrops",
        "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "airdropId", "type": "uint256" }],
        "name": "getAirdrop",
        "outputs": [
            { "internalType": "bytes32", "name": "merkleRoot", "type": "bytes32" },
            { "internalType": "address", "name": "tokenAddress", "type": "address" },
            { "internalType": "uint256", "name": "totalAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "claimedAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "startTime", "type": "uint256" },
            { "internalType": "uint256", "name": "endTime", "type": "uint256" },
            { "internalType": "uint256", "name": "vestingDuration", "type": "uint256" },
            { "internalType": "uint256", "name": "cliffPeriod", "type": "uint256" },
            { "internalType": "bool", "name": "active", "type": "bool" },
            { "internalType": "string", "name": "name", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "airdropId", "type": "uint256" },
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getUserClaimStatus",
        "outputs": [
            { "internalType": "uint256", "name": "totalAllocation", "type": "uint256" },
            { "internalType": "uint256", "name": "claimedAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "claimableNow", "type": "uint256" },
            { "internalType": "uint256", "name": "vestingProgress", "type": "uint256" },
            { "internalType": "uint256", "name": "nextVestTime", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const AIRDROP_ADDRESS = import.meta.env.VITE_AIRDROP_ADDRESS;

export default function AirdropClaimPanel() {
    const { address, isConnected } = useAccount();
    const [selectedAirdrop, setSelectedAirdrop] = useState(null);
    const [merkleProof, setMerkleProof] = useState([]);
    const [userAllocation, setUserAllocation] = useState(0);

    // Get active airdrops
    const { data: activeAirdrops } = useContractRead({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'getActiveAirdrops',
    });

    // Get selected airdrop details
    const { data: airdropDetails } = useContractRead({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'getAirdrop',
        args: [selectedAirdrop],
        enabled: selectedAirdrop !== null,
    });

    // Get user claim status
    const { data: claimStatus } = useContractRead({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'getUserClaimStatus',
        args: [selectedAirdrop, address],
        enabled: selectedAirdrop !== null && !!address,
    });

    // Claim tokens
    const { write: claimTokens, data: claimTxData } = useContractWrite({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'claim',
    });

    const { isLoading: isClaiming, isSuccess: claimSuccess } = useWaitForTransaction({
        hash: claimTxData?.hash,
    });

    // Load merkle proof for user
    useEffect(() => {
        if (!address || selectedAirdrop === null) return;

        // Fetch merkle proof from API/IPFS
        fetch(`/api/airdrop/${selectedAirdrop}/proof/${address}`)
            .then(res => res.json())
            .then(data => {
                setMerkleProof(data.proof || []);
                setUserAllocation(data.amount || 0);
            })
            .catch(console.error);
    }, [address, selectedAirdrop]);

    const handleClaim = () => {
        if (!merkleProof.length || !userAllocation) return;

        claimTokens({
            args: [selectedAirdrop, BigInt(userAllocation), merkleProof],
        });
    };

    if (!isConnected) {
        return (
            <div className="airdrop-panel">
                <h2>🎁 Claim Your Airdrops</h2>
                <div className="connect-prompt">
                    <p>Connect your wallet to check airdrop eligibility</p>
                    <button className="btn btn-primary">Connect Wallet</button>
                </div>
            </div>
        );
    }

    return (
        <div className="airdrop-panel">
            <div className="panel-header">
                <h2>🎁 Ionova Airdrops</h2>
                <p>Claim your token allocations</p>
            </div>

            {claimSuccess && (
                <div className="success-banner">
                    ✅ Tokens claimed successfully!
                </div>
            )}

            {/* Active Airdrops List */}
            <div className="airdrops-grid">
                {activeAirdrops?.map((airdropId) => (
                    <AirdropCard
                        key={airdropId.toString()}
                        airdropId={airdropId}
                        isSelected={selectedAirdrop === airdropId}
                        onClick={() => setSelectedAirdrop(airdropId)}
                        userAddress={address}
                    />
                ))}

                {(!activeAirdrops || activeAirdrops.length === 0) && (
                    <div className="no-airdrops">
                        <div className="empty-icon">📭</div>
                        <h3>No Active Airdrops</h3>
                        <p>Check back later for new distributions</p>
                    </div>
                )}
            </div>

            {/* Claim Details */}
            {selectedAirdrop !== null && airdropDetails && (
                <div className="claim-section">
                    <h3>{airdropDetails[9]}</h3>

                    <div className="claim-stats">
                        <div className="stat-row">
                            <span>Your Allocation:</span>
                            <strong>{claimStatus ? formatEther(claimStatus[0]) : '0'} tokens</strong>
                        </div>
                        <div className="stat-row">
                            <span>Already Claimed:</span>
                            <strong>{claimStatus ? formatEther(claimStatus[1]) : '0'} tokens</strong>
                        </div>
                        <div className="stat-row highlight">
                            <span>Claimable Now:</span>
                            <strong className="claimable">{claimStatus ? formatEther(claimStatus[2]) : '0'} tokens</strong>
                        </div>
                    </div>

                    {claimStatus && claimStatus[3] < 10000 && (
                        <div className="vesting-progress">
                            <div className="progress-label">
                                Vesting Progress: {(Number(claimStatus[3]) / 100).toFixed(2)}%
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${Number(claimStatus[3]) / 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-large btn-claim"
                        onClick={handleClaim}
                        disabled={
                            isClaiming ||
                            !claimStatus ||
                            claimStatus[2] === 0n ||
                            !merkleProof.length
                        }
                    >
                        {isClaiming ? (
                            <>
                                <span className="spinner"></span>
                                Claiming...
                            </>
                        ) : claimStatus && claimStatus[2] > 0n ? (
                            <>💰 Claim {formatEther(claimStatus[2])} Tokens</>
                        ) : (
                            <>🔒 Nothing to Claim</>
                        )}
                    </button>

                    {!merkleProof.length && userAllocation === 0 && (
                        <div className="warning-box">
                            ⚠️ You are not eligible for this airdrop
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Airdrop Card Component
function AirdropCard({ airdropId, isSelected, onClick, userAddress }) {
    const { data: details } = useContractRead({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'getAirdrop',
        args: [airdropId],
    });

    const { data: userStatus } = useContractRead({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: 'getUserClaimStatus',
        args: [airdropId, userAddress],
        enabled: !!userAddress,
    });

    if (!details) return null;

    const [
        ,
        ,
        totalAmount,
        claimedAmount,
        startTime,
        endTime,
        ,
        ,
        active,
        name
    ] = details;

    const progress = Number(claimedAmount) / Number(totalAmount) * 100;
    const hasAllocation = userStatus && userStatus[0] > 0n;
    const claimableNow = userStatus ? userStatus[2] : 0n;

    return (
        <div
            className={`airdrop-card ${isSelected ? 'selected' : ''} ${hasAllocation ? 'eligible' : ''}`}
            onClick={onClick}
        >
            <div className="card-header">
                <h4>{name}</h4>
                {hasAllocation && <span className="eligible-badge">✅ Eligible</span>}
            </div>

            <div className="card-stats">
                <div className="stat-item">
                    <div className="stat-label">Total Allocation</div>
                    <div className="stat-value">{formatEther(totalAmount)}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Distribution</div>
                    <div className="stat-value">{progress.toFixed(1)}%</div>
                </div>
            </div>

            {hasAllocation && (
                <div className="user-allocation">
                    <div className="allocation-label">Your Claimable:</div>
                    <div className="allocation-value">{formatEther(claimableNow)}</div>
                </div>
            )}

            <div className="card-footer">
                <div className="time-info">
                    Ends: {new Date(Number(endTime) * 1000).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

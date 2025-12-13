import React, { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import './RewardsDashboard.css';

/**
 * Rewards Dashboard Component
 * Displays user's validator rewards with auto-staking split
 * Shows claimable balance, auto-staked balance, and total earnings
 */
const RewardsDashboard = ({ distributorAddress, ionxAddress }) => {
    const { address, isConnected } = useAccount();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Read user balance from distributor
    const { data: userBalance, refetch: refetchBalance } = useReadContract({
        address: distributorAddress,
        abi: [{
            name: 'getUserBalance',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'user', type: 'address' }],
            outputs: [
                { name: 'autoStaked', type: 'uint256' },
                { name: 'claimable', type: 'uint256' },
                { name: 'totalEarned', type: 'uint256' },
                { name: 'totalClaimed', type: 'uint256' },
                { name: 'lastCredit', type: 'uint256' }
            ]
        }],
        functionName: 'getUserBalance',
        args: [address],
        enabled: isConnected && !!address,
    });

    // Read pending rewards (rewards since last distribution)
    const { data: pending Rewards } = useReadContract({
        address: distributorAddress,
        abi: [{
            name: 'getPendingRewards',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'user', type: 'address' }],
            outputs: [
                { name: 'totalPending', type: 'uint256' },
                { name: 'autoStakePending', type: 'uint256' },
                { name: 'claimablePending', type: 'uint256' }
            ]
        }],
        functionName: 'getPendingRewards',
        args: [address],
        enabled: isConnected && !!address,
    });

    // Get distribution stats
    const { data: stats } = useReadContract({
        address: distributorAddress,
        abi: [{
            name: 'getStats',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [
                { name: 'totalDistributed', type: 'uint256' },
                { name: 'totalAutoStaked', type: 'uint256' },
                { name: 'totalClaimed', type: 'uint256' },
                { name: 'distributionCount', type: 'uint256' },
                { name: 'lastDistributionBlock', type: 'uint256' },
                { name: 'holderCount', type: 'uint256' },
                { name: 'blocksUntilNext', type: 'uint256' }
            ]
        }],
        functionName: 'getStats',
        enabled: isConnected,
    });

    // Claim rewards
    const { writeContract: claimRewards, data: claimHash, isPending: isClaiming } = useWriteContract();

    const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
        hash: claimHash,
    });

    // Handle claim
    const handleClaim = async () => {
        if (!userBalance || parseFloat(formatUnits(userBalance[1], 18)) === 0) {
            return;
        }

        claimRewards({
            address: distributorAddress,
            abi: [{
                name: 'claimRewards',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [],
                outputs: []
            }],
            functionName: 'claimRewards',
        });
    };

    // Refresh after claim success
    useEffect(() => {
        if (isClaimSuccess) {
            setTimeout(() => {
                refetchBalance();
                setRefreshTrigger(prev => prev + 1);
            }, 2000);
        }
    }, [isClaimSuccess, refetchBalance]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetchBalance();
        }, 30000);
        return () => clearInterval(interval);
    }, [refetchBalance]);

    if (!isConnected) {
        return (
            <div className="rewards-dashboard">
                <div className="connect-prompt">
                    <h3>🔌 Connect Wallet</h3>
                    <p>Connect your wallet to view your validator rewards</p>
                </div>
            </div>
        );
    }

    const autoStaked = userBalance ? parseFloat(formatUnits(userBalance[0], 18)) : 0;
    const claimable = userBalance ? parseFloat(formatUnits(userBalance[1], 18)) : 0;
    const totalEarned = userBalance ? parseFloat(formatUnits(userBalance[2], 18)) : 0;
    const totalClaimed = userBalance ? parseFloat(formatUnits(userBalance[3], 18)) : 0;
    const lastCreditBlock = userBalance ? Number(userBalance[4]) : 0;

    const pendingTotal = pendingRewards ? parseFloat(formatUnits(pendingRewards[0], 18)) : 0;
    const pendingAutoStake = pendingRewards ? parseFloat(formatUnits(pendingRewards[1], 18)) : 0;
    const pendingClaimable = pendingRewards ? parseFloat(formatUnits(pendingRewards[2], 18)) : 0;

    const blocksUntilNext = stats ? Number(stats[6]) : 0;
    const hoursUntilNext = (blocksUntilNext / 3600).toFixed(1);

    return (
        <div className="rewards-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h2>💰 Your Validator Rewards</h2>
                <div className="next-distribution">
                    {blocksUntilNext > 0 ? (
                        <>
                            <span className="label">Next Distribution:</span>
                            <span className="time">{hoursUntilNext}h ({blocksUntilNext.toLocaleString()} blocks)</span>
                        </>
                    ) : (
                        <span className="ready">Distribution Ready! 🎉</span>
                    )}
                </div>
            </div>

            {/* Main Balance Cards */}
            <div className="balance-grid">
                {/* Claimable Balance */}
                <div className="balance-card claimable">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <h3>Claimable Balance</h3>
                        <div className="amount">{claimable.toLocaleString()} IONX</div>
                        <div className="pending">
                            +{pendingClaimable.toFixed(2)} IONX pending
                        </div>
                        <button
                            className="btn btn-primary claim-btn"
                            onClick={handleClaim}
                            disabled={claimable === 0 || isClaiming || isClaimConfirming}
                        >
                            {isClaiming || isClaimConfirming ? (
                                <>⏳ Claiming...</>
                            ) : isClaimSuccess ? (
                                <>✅ Claimed!</>
                            ) : (
                                <>Claim Rewards</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Auto-Staked Balance */}
                <div className="balance-card auto-staked">
                    <div className="card-icon">🔄</div>
                    <div className="card-content">
                        <h3>Auto-Staked Balance</h3>
                        <div className="amount">{autoStaked.toLocaleString()} IONX</div>
                        <div className="pending">
                            +{pendingAutoStake.toFixed(2)} IONX pending
                        </div>
                        <div className="info-text">
                            Automatically compounding
                        </div>
                    </div>
                </div>

                {/* Total Earned */}
                <div className="balance-card total-earned">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                        <h3>Total Earned</h3>
                        <div className="amount">{totalEarned.toLocaleString()} IONX</div>
                        <div className="sub-stats">
                            <div>Claimed: {totalClaimed.toLocaleString()} IONX</div>
                            <div>Unclaimed: {(totalEarned - totalClaimed).toLocaleString()} IONX</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reward Breakdown */}
            <div className="reward-breakdown">
                <h3>📈 Daily Reward Split (50/50)</h3>
                <div className="breakdown-visual">
                    <div className="breakdown-bar">
                        <div className="bar-section auto-stake" style={{ width: '50%' }}>
                            <span>50% Auto-Stake</span>
                            <span className="value">Compounds</span>
                        </div>
                        <div className="bar-section claimable" style={{ width: '50%' }}>
                            <span>50% Claimable</span>
                            <span className="value">Withdraw Anytime</span>
                        </div>
                    </div>
                </div>
                <p className="info-text">
                    ℹ️ Rewards are automatically credited daily. 50% compounds for growth, 50% is available to claim.
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-label">Last Credit</div>
                    <div className="stat-value">
                        {lastCreditBlock > 0 ? `Block #${lastCreditBlock.toLocaleString()}` : 'Not yet'}
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Lifetime ROI</div>
                    <div className="stat-value">
                        {totalEarned > 0 ? `${((claimable + autoStaked) / totalEarned * 100).toFixed(1)}%` : '0%'}
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">Claim Rate</div>
                    <div className="stat-value">
                        {totalEarned > 0 ? `${(totalClaimed / totalEarned * 100).toFixed(1)}%` : '0%'}
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {isClaimSuccess && (
                <div className="success-banner">
                    ✅ Successfully claimed {claimable.toFixed(2)} IONX!
                </div>
            )}
        </div>
    );
};

export default RewardsDashboard;

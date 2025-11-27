import { useState } from 'react';
import { useWallet, useIONXBalance, useStakingInfo } from '../hooks/useWallet';
import './WalletDashboard.css';

/**
 * Comprehensive wallet dashboard
 * Shows balances, transactions, staking info, and portfolio
 */
function WalletDashboard() {
    const wallet = useWallet();
    const ionxBalance = useIONXBalance('0x...'); // Replace with actual IONX token address
    const stakingInfo = useStakingInfo('0x...'); // Replace with staking contract address

    const [activeTab, setActiveTab] = useState('overview');

    if (!wallet.isConnected) {
        return (
            <div className="wallet-dashboard-empty">
                <div className="empty-state">
                    <div className="empty-icon">👛</div>
                    <h2>Connect Your Wallet</h2>
                    <p>Connect your wallet to view your Ionova portfolio</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'transactions', label: 'Transactions', icon: '📜' },
        { id: 'staking', label: 'Staking', icon: '💎' },
        { id: 'nfts', label: 'NFTs', icon: '🖼️' },
    ];

    return (
        <div className="wallet-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="wallet-info-card">
                    <div className="wallet-icon">
                        {wallet.walletInfo?.name === 'MetaMask' && '🦊'}
                        {wallet.walletInfo?.name === 'WalletConnect' && '📱'}
                        {wallet.walletInfo?.name === 'Coinbase Wallet' && '🔵'}
                    </div>
                    <div className="wallet-details">
                        <div className="wallet-name">{wallet.walletInfo?.name || 'Wallet'}</div>
                        <div className="wallet-address">{wallet.formatAddress(wallet.address)}</div>
                    </div>
                    <div className="network-badge">
                        <span className="network-dot"></span>
                        {wallet.chainName || 'Unknown Network'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {activeTab === 'overview' && (
                    <OverviewTab
                        wallet={wallet}
                        ionxBalance={ionxBalance}
                        stakingInfo={stakingInfo}
                    />
                )}
                {activeTab === 'transactions' && (
                    <TransactionsTab transactions={wallet.transactions} loading={wallet.loadingTxs} />
                )}
                {activeTab === 'staking' && (
                    <StakingTab stakingInfo={stakingInfo} />
                )}
                {activeTab === 'nfts' && (
                    <NFTsTab address={wallet.address} />
                )}
            </div>
        </div>
    );
}

/* Overview Tab */
function OverviewTab({ wallet, ionxBalance, stakingInfo }) {
    const totalValue = wallet.balance + ionxBalance.balance + stakingInfo.staked;

    return (
        <div className="overview-tab">
            {/* Total Portfolio Value */}
            <div className="portfolio-card">
                <div className="card-header">
                    <h3>Total Portfolio Value</h3>
                    <span className="refresh-btn" onClick={wallet.refetchBalance}>🔄</span>
                </div>
                <div className="portfolio-value">
                    <div className="value-amount">{totalValue.toFixed(4)} IONX</div>
                    <div className="value-usd">≈ ${(totalValue * 0.10).toFixed(2)} USD</div>
                </div>
            </div>

            {/* Balances Grid */}
            <div className="balances-grid">
                {/* Native IONX */}
                <div className="balance-card">
                    <div className="balance-header">
                        <span className="balance-icon">⚡</span>
                        <span className="balance-label">IONX Balance</span>
                    </div>
                    <div className="balance-amount">{wallet.formattedBalance}</div>
                    <div className="balance-usd">≈ ${(wallet.balance * 0.10).toFixed(2)}</div>
                </div>

                {/* Staked IONX */}
                <div className="balance-card staking">
                    <div className="balance-header">
                        <span className="balance-icon">💎</span>
                        <span className="balance-label">Staked</span>
                    </div>
                    <div className="balance-amount">{stakingInfo.staked.toFixed(4)}</div>
                    <div className="balance-info">
                        <span className="apr-badge">{stakingInfo.apr}% APR</span>
                    </div>
                </div>

                {/* Rewards */}
                <div className="balance-card rewards">
                    <div className="balance-header">
                        <span className="balance-icon">🎁</span>
                        <span className="balance-label">Rewards</span>
                    </div>
                    <div className="balance-amount">{stakingInfo.rewards.toFixed(4)}</div>
                    <button className="claim-btn">Claim</button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button className="action-btn">
                        <span className="action-icon">📤</span>
                        <span className="action-label">Send</span>
                    </button>
                    <button className="action-btn">
                        <span className="action-icon">📥</span>
                        <span className="action-label">Receive</span>
                    </button>
                    <button className="action-btn">
                        <span className="action-icon">🔄</span>
                        <span className="action-label">Swap</span>
                    </button>
                    <button className="action-btn">
                        <span className="action-icon">💰</span>
                        <span className="action-label">Stake</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Transactions Tab */
function TransactionsTab({ transactions, loading }) {
    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner-large"></div>
                <p>Loading transactions...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📜</div>
                <h3>No Transactions Yet</h3>
                <p>Your transaction history will appear here</p>
            </div>
        );
    }

    return (
        <div className="transactions-tab">
            <div className="transactions-list">
                {transactions.map((tx, index) => (
                    <div key={index} className="transaction-item">
                        <div className="tx-icon">{tx.type === 'send' ? '📤' : '📥'}</div>
                        <div className="tx-details">
                            <div className="tx-type">{tx.type}</div>
                            <div className="tx-time">{new Date(tx.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="tx-amount">
                            {tx.type === 'send' ? '-' : '+'}{tx.amount} IONX
                        </div>
                        <div className="tx-status">
                            <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* Staking Tab */
function StakingTab({ stakingInfo }) {
    return (
        <div className="staking-tab">
            <div className="staking-stats">
                <div className="stat-card">
                    <div className="stat-label">Total Staked</div>
                    <div className="stat-value">{stakingInfo.staked.toFixed(4)} IONX</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Rewards</div>
                    <div className="stat-value">{stakingInfo.rewards.toFixed(4)} IONX</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Current APR</div>
                    <div className="stat-value">{stakingInfo.apr}%</div>
                </div>
            </div>

            <div className="staking-actions">
                <button className="btn btn-primary btn-large">Stake More</button>
                <button className="btn btn-secondary btn-large">Unstake</button>
            </div>

            <div className="staking-info">
                <h3>Staking Information</h3>
                <ul>
                    <li>✅ Auto-compounding rewards</li>
                    <li>⏱️ 21-day unbonding period</li>
                    <li>💰 {stakingInfo.apr}% APR (Year 1-2)</li>
                    <li>🔒 No minimum stake required</li>
                </ul>
            </div>
        </div>
    );
}

/* NFTs Tab */
function NFTsTab({ address }) {
    return (
        <div className="nfts-tab">
            <div className="empty-state">
                <div className="empty-icon">🖼️</div>
                <h3>No NFTs Yet</h3>
                <p>Your Validator Fraction NFTs will appear here</p>
                <button className="btn btn-primary">Browse Validator Sale</button>
            </div>
        </div>
    );
}

export default WalletDashboard;

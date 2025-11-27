import { useState } from 'react';
import { useMockWallet } from '../hooks/useMockWallet';
import { MOCK_PORTFOLIO, MOCK_NFTS, MOCK_PAYMENTS } from '../utils/mockData';
import './DemoMode.css';

/**
 * Demo mode component
 * Showcases all wallet features with mock data
 */
function DemoMode() {
    const wallet = useMockWallet();
    const [activeTab, setActiveTab] = useState('overview');
    const [sendAmount, setSendAmount] = useState('');
    const [sendTo, setSendTo] = useState('');

    const handleConnect = async () => {
        await wallet.connect();
    };

    const handleSend = async () => {
        if (!sendAmount || !sendTo) return;
        await wallet.sendTransaction(sendTo, sendAmount, 'Demo payment');
        setSendAmount('');
        setSendTo('');
    };

    if (!wallet.isConnected) {
        return (
            <div className="demo-mode">
                <div className="demo-banner">
                    <span className="demo-badge">🎭 DEMO MODE</span>
                    <p>Experience Ionova wallet with simulated data</p>
                </div>

                <div className="demo-connect">
                    <div className="demo-hero">
                        <h1>⚡ Ionova Wallet Demo</h1>
                        <p>Explore all features without connecting a real wallet</p>
                    </div>

                    <button
                        onClick={handleConnect}
                        className="btn btn-primary btn-large"
                        disabled={wallet.loading}
                    >
                        {wallet.loading ? 'Connecting...' : 'Start Demo'}
                    </button>

                    <div className="demo-features">
                        <div className="feature">
                            <span className="feature-icon">💰</span>
                            <span>View Portfolio</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">📜</span>
                            <span>Transaction History</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">💎</span>
                            <span>Staking Dashboard</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🖼️</span>
                            <span>NFT Gallery</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="demo-mode">
            <div className="demo-banner">
                <span className="demo-badge">🎭 DEMO MODE</span>
                <span className="demo-address">{wallet.formatAddress(wallet.address)}</span>
                <button onClick={wallet.disconnect} className="btn-disconnect-demo">
                    Exit Demo
                </button>
            </div>

            {/* Portfolio Overview */}
            <div className="demo-portfolio">
                <div className="portfolio-header">
                    <h2>Total Portfolio Value</h2>
                    <div className="portfolio-value">
                        ${MOCK_PORTFOLIO.totalValue.toLocaleString()}
                    </div>
                    <div className={`portfolio-change ${MOCK_PORTFOLIO.change24h > 0 ? 'positive' : 'negative'}`}>
                        {MOCK_PORTFOLIO.change24h > 0 ? '↑' : '↓'} {Math.abs(MOCK_PORTFOLIO.change24h)}%
                    </div>
                </div>

                <div className="balances-grid">
                    <div className="balance-card">
                        <div className="balance-label">IONX Balance</div>
                        <div className="balance-amount">{wallet.formattedBalance}</div>
                        <div className="balance-usd">${(wallet.balance * 0.10).toFixed(2)}</div>
                    </div>

                    <div className="balance-card">
                        <div className="balance-label">Staked</div>
                        <div className="balance-amount">{wallet.stakingData.totalStaked.toLocaleString()}</div>
                        <div className="balance-info">
                            <span className="apr-badge">{wallet.stakingData.apr}% APR</span>
                        </div>
                    </div>

                    <div className="balance-card">
                        <div className="balance-label">Rewards</div>
                        <div className="balance-amount">{wallet.stakingData.pendingRewards.toFixed(4)}</div>
                        <button
                            onClick={wallet.claimRewards}
                            className="claim-btn"
                            disabled={wallet.loading}
                        >
                            {wallet.loading ? 'Claiming...' : 'Claim'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="demo-tabs">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                >
                    📊 Overview
                </button>
                <button
                    onClick={() => setActiveTab('send')}
                    className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                >
                    📤 Send
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
                >
                    📜 Transactions
                </button>
                <button
                    onClick={() => setActiveTab('nfts')}
                    className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                >
                    🖼️ NFTs
                </button>
            </div>

            {/* Tab Content */}
            <div className="demo-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <h3>Asset Allocation</h3>
                        <div className="assets-list">
                            {MOCK_PORTFOLIO.assets.map((asset, index) => (
                                <div key={index} className="asset-item">
                                    <div className="asset-info">
                                        <div className="asset-name">{asset.symbol}</div>
                                        <div className="asset-balance">{asset.balance.toLocaleString()}</div>
                                    </div>
                                    <div className="asset-value">
                                        <div className="value">${asset.value.toLocaleString()}</div>
                                        <div className="allocation">{asset.allocation}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'send' && (
                    <div className="send-tab">
                        <h3>Send IONX</h3>
                        <div className="send-form">
                            <div className="form-group">
                                <label>Recipient Address</label>
                                <input
                                    type="text"
                                    value={sendTo}
                                    onChange={(e) => setSendTo(e.target.value)}
                                    placeholder="0x..."
                                    className="input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount (IONX)</label>
                                <input
                                    type="number"
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="input"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                className="btn btn-primary btn-large"
                                disabled={wallet.loading || !sendAmount || !sendTo}
                            >
                                {wallet.loading ? 'Sending...' : 'Send Payment'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="transactions-tab">
                        <h3>Recent Transactions</h3>
                        <div className="transactions-list">
                            {wallet.transactions.slice(0, 10).map((tx) => (
                                <div key={tx.id} className="transaction-item">
                                    <div className="tx-icon">
                                        {tx.type === 'send' ? '📤' : '📥'}
                                    </div>
                                    <div className="tx-details">
                                        <div className="tx-type">{tx.type}</div>
                                        <div className="tx-time">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="tx-amount">
                                        {tx.type === 'send' ? '-' : '+'}{tx.amount} IONX
                                    </div>
                                    <div className={`tx-status ${tx.status}`}>
                                        {tx.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'nfts' && (
                    <div className="nfts-tab">
                        <h3>Validator Fraction NFTs</h3>
                        <div className="nfts-grid">
                            {MOCK_NFTS.map((nft) => (
                                <div key={nft.id} className="nft-card">
                                    <img src={nft.image} alt={nft.name} />
                                    <div className="nft-info">
                                        <div className="nft-name">{nft.name}</div>
                                        <div className="nft-fractions">{nft.fractions} fractions</div>
                                        <div className="nft-value">
                                            <span>Value: {nft.currentValue} IONX</span>
                                            <span className="nft-rewards">+{nft.rewards} rewards</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DemoMode;

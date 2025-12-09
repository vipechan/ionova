import { useState } from 'react';
import { useAccount } from 'wagmi';
import './Airdrop.css';

export default function Airdrop() {
    const { address, isConnected } = useAccount();
    const [checkAddress, setCheckAddress] = useState('');
    const [status, setStatus] = useState('idle'); // idle, checking, eligible, not-eligible, submitting, pending-verification, claimed

    const handleCheck = (e) => {
        e.preventDefault();
        setStatus('checking');

        // Mock API call simulation
        setTimeout(() => {
            // Mock logic: addresses starting with 0x1... are eligible
            if (checkAddress.toLowerCase().startsWith('0x1') || checkAddress.toLowerCase() === address?.toLowerCase()) {
                setStatus('eligible');
            } else {
                setStatus('not-eligible');
            }
        }, 1000);
    };

    const handleSubmitForVerification = () => {
        setStatus('submitting');

        // Mock submission
        setTimeout(() => {
            setStatus('pending-verification');
        }, 1500);
    };

    return (
        <div className="airdrop-container">
            <div className="airdrop-hero">
                <h1>🪂 Ionova Social Airdrop</h1>
                <p>Complete social tasks to earn <strong>100 IONX</strong>. Manual verification required.</p>
            </div>

            <div className="airdrop-card">
                <div className="status-badge">
                    {status === 'idle' && 'Ready to Check'}
                    {status === 'checking' && 'Checking Eligibility...'}
                    {status === 'eligible' && '🎉 Tasks Available!'}
                    {status === 'not-eligible' && '❌ Not Eligible'}
                    {status === 'submitting' && 'Submitting for Review...'}
                    {status === 'pending-verification' && '⏳ Pending Admin Verification'}
                    {status === 'claimed' && '✅ Tokens Claimed!'}
                </div>

                {status === 'eligible' ? (
                    <div className="claim-content">
                        <div className="reward-amount">
                            <span className="label">Potential Reward</span>
                            <span className="amount">100 IONX</span>
                        </div>

                        <div className="social-tasks">
                            <h3>Complete Tasks to Qualify</h3>
                            <div className="task-list">
                                <div className="task-item">
                                    <span className="task-icon">🐦</span>
                                    <div className="task-details">
                                        <h4>Follow on Twitter</h4>
                                        <p>Follow @IonovaNetwork and retweet our pinned post</p>
                                    </div>
                                    <a href="https://twitter.com/IonovaNetwork" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                        Go to Twitter
                                    </a>
                                </div>
                                <div className="task-item">
                                    <span className="task-icon">✈️</span>
                                    <div className="task-details">
                                        <h4>Join Telegram</h4>
                                        <p>Join our official Telegram group</p>
                                    </div>
                                    <a href="https://t.me/ionova" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                        Join Telegram
                                    </a>
                                </div>
                                <div className="task-item">
                                    <span className="task-icon">📺</span>
                                    <div className="task-details">
                                        <h4>Subscribe on YouTube</h4>
                                        <p>Subscribe to our YouTube channel</p>
                                    </div>
                                    <a href="https://youtube.com/@ionova" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                        Subscribe
                                    </a>
                                </div>
                            </div>
                            <button className="btn btn-primary btn-large" onClick={handleSubmitForVerification}>
                                Submit for Verification
                            </button>
                        </div>
                    </div>
                ) : status === 'pending-verification' ? (
                    <div className="success-message">
                        <h3>Submission Received!</h3>
                        <p>Your wallet <strong>{checkAddress}</strong> is under review.</p>
                        <p>Once verified by an admin, 100 IONX will be transferred to your wallet.</p>
                        <div className="verification-status-box">
                            <span className="spinner-small"></span> Awaiting Admin Approval
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCheck} className="check-form">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter Wallet Address (0x...)"
                                value={checkAddress}
                                onChange={(e) => setCheckAddress(e.target.value)}
                                className="address-input"
                            />
                            <button type="submit" className="btn btn-primary" disabled={!checkAddress || status === 'checking'}>
                                Check Eligibility
                            </button>
                        </div>
                        {isConnected && (
                            <button
                                type="button"
                                className="btn btn-secondary use-wallet-btn"
                                onClick={() => setCheckAddress(address)}
                            >
                                Use Connected Wallet
                            </button>
                        )}
                    </form>
                )}
            </div>

            <div className="airdrop-stats">
                <div className="stat-box">
                    <h3>Total Airdrop</h3>
                    <p>100,000 IONX</p>
                </div>
                <div className="stat-box">
                    <h3>Pending Review</h3>
                    <p>1,250 Users</p>
                </div>
                <div className="stat-box">
                    <h3>Verified</h3>
                    <p>8,450 Users</p>
                </div>
            </div>

            <div className="info-section">
                <h2>How it Works</h2>
                <div className="criteria-grid">
                    <div className="criteria-item">
                        <span className="icon">🐦</span>
                        <h3>Share & Like</h3>
                        <p>Share our pinned post on Twitter and tag 3 friends.</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">✈️</span>
                        <h3>Join Community</h3>
                        <p>Join our official Telegram group and say hello!</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">👮</span>
                        <h3>Manual Verification</h3>
                        <p>Our team manually verifies every submission to prevent bots.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

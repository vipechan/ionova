import { useState } from 'react';
import { useAccount } from 'wagmi';
import './Airdrop.css';

export default function Airdrop() {
    const { address, isConnected } = useAccount();
    const [checkAddress, setCheckAddress] = useState('');
    const [status, setStatus] = useState('idle'); // idle, checking, show-tasks, submitting, pending-verification, claimed
    const [completedTasks, setCompletedTasks] = useState({
        youtube: false,
        twitterFollow: false,
        twitterLike: false,
        twitterRetweet: false,
        telegramChannel: false,
        telegramGroup: false,
        facebook: false
    });

    const handleCheck = (e) => {
        e.preventDefault();
        setStatus('checking');

        // Mock API call simulation
        setTimeout(() => {
            setStatus('show-tasks');
        }, 1000);
    };

    const toggleTask = (task) => {
        setCompletedTasks(prev => ({
            ...prev,
            [task]: !prev[task]
        }));
    };

    const allTasksCompleted = Object.values(completedTasks).every(task => task === true);

    const handleSubmitForVerification = () => {
        if (!allTasksCompleted) {
            alert('Please complete ALL tasks before submitting!');
            return;
        }

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
                <p>Complete <strong>ALL</strong> social tasks to earn <strong>50 IONX</strong> + <strong>12.5 IONX per referral</strong>.</p>
                <div className="airdrop-info-badges">
                    <span className="badge">💰 50 IONX Base Reward</span>
                    <span className="badge">👥 12.5 IONX Per Referral</span>
                    <span className="badge requirement">⚠️ ALL Tasks Required</span>
                </div>
            </div>

            <div className="airdrop-card">
                <div className="status-badge">
                    {status === 'idle' && 'Ready to Start'}
                    {status === 'checking' && 'Checking Eligibility...'}
                    {status === 'show-tasks' && '📝 Complete ALL Tasks Below'}
                    {status === 'submitting' && 'Submitting for Review...'}
                    {status === 'pending-verification' && '⏳ Pending Admin Verification'}
                    {status === 'claimed' && '✅ Tokens Claimed!'}
                </div>

                {status === 'show-tasks' ? (
                    <div className="claim-content">
                        <div className="reward-amount">
                            <span className="label">Base Reward</span>
                            <span className="amount">50 IONX</span>
                        </div>
                        <div className="referral-info">
                            <p className="info-text">💡 <strong>Earn More:</strong> Get <strong>12.5 IONX</strong> for each person who connects their wallet using your referral link!</p>
                        </div>

                        <div className="social-tasks">
                            <h3>✅ Complete ALL Tasks (Required)</h3>
                            <p className="tasks-warning">You MUST complete ALL tasks below to be eligible for the 50 IONX airdrop</p>

                            <div className="task-list">
                                {/* YouTube */}
                                <div className={`task-item ${completedTasks.youtube ? 'completed' : ''}`}>
                                    <span className="task-icon">📺</span>
                                    <div className="task-details">
                                        <h4>Subscribe on YouTube</h4>
                                        <p>Subscribe to Ionova Network channel</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://youtube.com/@ionova" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Go to YouTube
                                        </a>
                                        <button
                                            onClick={() => toggleTask('youtube')}
                                            className={`btn btn-sm ${completedTasks.youtube ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.youtube ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Twitter Follow */}
                                <div className={`task-item ${completedTasks.twitterFollow ? 'completed' : ''}`}>
                                    <span className="task-icon">🐦</span>
                                    <div className="task-details">
                                        <h4>Follow on Twitter</h4>
                                        <p>Follow @IonovaNetwork</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://twitter.com/IonovaNetwork" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Follow
                                        </a>
                                        <button
                                            onClick={() => toggleTask('twitterFollow')}
                                            className={`btn btn-sm ${completedTasks.twitterFollow ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.twitterFollow ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Twitter Like */}
                                <div className={`task-item ${completedTasks.twitterLike ? 'completed' : ''}`}>
                                    <span className="task-icon">❤️</span>
                                    <div className="task-details">
                                        <h4>Like Pinned Tweet</h4>
                                        <p>Like our pinned announcement tweet</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://twitter.com/IonovaNetwork" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Go to Tweet
                                        </a>
                                        <button
                                            onClick={() => toggleTask('twitterLike')}
                                            className={`btn btn-sm ${completedTasks.twitterLike ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.twitterLike ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Twitter Retweet */}
                                <div className={`task-item ${completedTasks.twitterRetweet ? 'completed' : ''}`}>
                                    <span className="task-icon">🔄</span>
                                    <div className="task-details">
                                        <h4>Retweet & Tag Friends</h4>
                                        <p>Retweet pinned post and tag 3 friends</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://twitter.com/IonovaNetwork" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Retweet
                                        </a>
                                        <button
                                            onClick={() => toggleTask('twitterRetweet')}
                                            className={`btn btn-sm ${completedTasks.twitterRetweet ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.twitterRetweet ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Telegram Channel */}
                                <div className={`task-item ${completedTasks.telegramChannel ? 'completed' : ''}`}>
                                    <span className="task-icon">✈️</span>
                                    <div className="task-details">
                                        <h4>Join Telegram Channel</h4>
                                        <p>Join official Ionova announcement channel</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://t.me/ionova_channel" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Join Channel
                                        </a>
                                        <button
                                            onClick={() => toggleTask('telegramChannel')}
                                            className={`btn btn-sm ${completedTasks.telegramChannel ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.telegramChannel ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Telegram Group */}
                                <div className={`task-item ${completedTasks.telegramGroup ? 'completed' : ''}`}>
                                    <span className="task-icon">💬</span>
                                    <div className="task-details">
                                        <h4>Join Telegram Group</h4>
                                        <p>Join Ionova community discussion group</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://t.me/ionova" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Join Group
                                        </a>
                                        <button
                                            onClick={() => toggleTask('telegramGroup')}
                                            className={`btn btn-sm ${completedTasks.telegramGroup ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.telegramGroup ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>

                                {/* Facebook */}
                                <div className={`task-item ${completedTasks.facebook ? 'completed' : ''}`}>
                                    <span className="task-icon">👍</span>
                                    <div className="task-details">
                                        <h4>Follow on Facebook</h4>
                                        <p>Like & Follow Ionova Network page</p>
                                    </div>
                                    <div className="task-actions">
                                        <a href="https://facebook.com/ionova" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                            Follow Page
                                        </a>
                                        <button
                                            onClick={() => toggleTask('facebook')}
                                            className={`btn btn-sm ${completedTasks.facebook ? 'btn-success' : 'btn-secondary'}`}
                                        >
                                            {completedTasks.facebook ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="task-progress">
                                <p>Tasks Completed: {Object.values(completedTasks).filter(Boolean).length}/7</p>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(Object.values(completedTasks).filter(Boolean).length / 7) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-large"
                                onClick={handleSubmitForVerification}
                                disabled={!allTasksCompleted}
                            >
                                {allTasksCompleted ? 'Submit for Verification ✓' : 'Complete All Tasks First (Locked 🔒)'}
                            </button>
                        </div>
                    </div>
                ) : status === 'pending-verification' ? (
                    <div className="success-message">
                        <h3>Submission Received!</h3>
                        <p>Your wallet <strong>{checkAddress}</strong> is under review.</p>
                        <p>Our team will verify that you completed all 7 social tasks:</p>
                        <ul className="verification-checklist">
                            <li>✓ YouTube subscription</li>
                            <li>✓ Twitter follow</li>
                            <li>✓ Twitter like</li>
                            <li>✓ Twitter retweet with tags</li>
                            <li>✓ Telegram channel joined</li>
                            <li>✓ Telegram group joined</li>
                            <li>✓ Facebook page followed</li>
                        </ul>
                        <p>Once verified by an admin, 50 IONX will be transferred to your wallet.</p>
                        <p className="referral-note">💡 Share your referral link to earn an additional <strong>12.5 IONX per friend</strong> who connects their wallet!</p>
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
                                Start Tasks
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
                    <h3>Total Airdrop Pool</h3>
                    <p>50,000 IONX</p>
                    <small>Base rewards only</small>
                </div>
                <div className="stat-box">
                    <h3>Referral Bonus Pool</h3>
                    <p>Unlimited</p>
                    <small>12.5 IONX per referral</small>
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
                <h2>All Required Tasks</h2>
                <div className="criteria-grid">
                    <div className="criteria-item">
                        <span className="icon">📺</span>
                        <h3>YouTube</h3>
                        <p>Subscribe to our channel</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">🐦</span>
                        <h3>Twitter (3 Tasks)</h3>
                        <p>Follow, Like, and Retweet with tags</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">✈️</span>
                        <h3>Telegram (2 Tasks)</h3>
                        <p>Join channel AND group</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">👍</span>
                        <h3>Facebook</h3>
                        <p>Follow our page</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">👮</span>
                        <h3>Manual Verification</h3>
                        <p>Admin manually verifies all tasks</p>
                    </div>
                    <div className="criteria-item">
                        <span className="icon">🎁</span>
                        <h3>Reward</h3>
                        <p>50 IONX + 12.5 per referral</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

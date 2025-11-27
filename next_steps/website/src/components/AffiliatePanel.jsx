import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAffiliate } from '../hooks/useAffiliate';

export default function AffiliatePanel() {
    const { address } = useAccount();
    const {
        stats,
        rankName,
        nextRankReqs,
        claimCommission,
        isClaiming,
        claimSuccess,
    } = useAffiliate();

    const [copied, setCopied] = useState(false);

    // Generate affiliate link
    const affiliateLink = `${window.location.origin}?ref=${address}`;

    // Copy to clipboard
    const copyLink = () => {
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Share on social media
    const shareTwitter = () => {
        const text = `Join the Ionova Validator Fraction Sale and earn passive income! Use my referral link:`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateLink)}`, '_blank');
    };

    const shareTelegram = () => {
        const text = `Join Ionova Validator Sale! Earn rewards from validator fees. Use my link: ${affiliateLink}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent(text)}`, '_blank');
    };

    if (!stats) {
        return (
            <div className="affiliate-panel loading">
                <div className="spinner"></div>
                <p>Loading affiliate data...</p>
            </div>
        );
    }

    const commissionRatePercent = (stats.commissionRate / 100).toFixed(0);
    const progressToNext = nextRankReqs.nextRank !== 4
        ? {
            downline: ((stats.downlineSalesTotal / (stats.downlineSalesTotal + nextRankReqs.downlineNeeded)) * 100).toFixed(0),
            self: ((stats.selfSalesTotal / (stats.selfSalesTotal + nextRankReqs.selfNeeded)) * 100).toFixed(0),
        }
        : { downline: 100, self: 100 };

    return (
        <div className="affiliate-panel">
            <div className="panel-header">
                <h2>💼 Affiliate Dashboard</h2>
                <div className={`rank-badge rank-${rankName.toLowerCase()}`}>
                    {getRankEmoji(rankName)} {rankName}
                </div>
            </div>

            {/* Affiliate Link */}
            <div className="affiliate-link-section">
                <h3>🔗 Your Affiliate Link</h3>
                <div className="link-container">
                    <input
                        type="text"
                        value={affiliateLink}
                        readOnly
                        className="link-input"
                    />
                    <button onClick={copyLink} className="btn btn-secondary">
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>

                <div className="share-buttons">
                    <button onClick={shareTwitter} className="btn btn-social twitter">
                        🐦 Share on Twitter
                    </button>
                    <button onClick={shareTelegram} className="btn btn-social telegram">
                        ✈️ Share on Telegram
                    </button>
                </div>
            </div>

            {/* Commission Stats */}
            <div className="commission-stats">
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <label>Pending Commission</label>
                        <h3>${parseFloat(stats.pendingCommission).toLocaleString()}</h3>
                        <span>USDC</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <label>Total Earned</label>
                        <h3>${parseFloat(stats.totalEarned).toLocaleString()}</h3>
                        <span>All time</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <label>Commission Rate</label>
                        <h3>{commissionRatePercent}%</h3>
                        <span>Current rate</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <label>Downline Sales</label>
                        <h3>${parseFloat(stats.downlineSalesTotal).toLocaleString()}</h3>
                        <span>Total volume</span>
                    </div>
                </div>
            </div>

            {/* Claim Button */}
            {stats.pendingCommission > 0 && (
                <div className="claim-section">
                    <button
                        onClick={() => claimCommission()}
                        disabled={isClaiming}
                        className="btn btn-primary btn-large"
                    >
                        {isClaiming ? (
                            <>
                                <span className="spinner-small"></span>
                                Claiming...
                            </>
                        ) : (
                            <>💸 Claim ${parseFloat(stats.pendingCommission).toLocaleString()} USDC</>
                        )}
                    </button>

                    {claimSuccess && (
                        <div className="claim-success">
                            ✅ Commission claimed successfully!
                        </div>
                    )}
                </div>
            )}

            {/* Rank Progress */}
            {nextRankReqs.nextRank !== 4 && (
                <div className="rank-progress">
                    <h3>📈 Progress to {getRankName(nextRankReqs.nextRank)}</h3>

                    <div className="progress-item">
                        <div className="progress-header">
                            <span>Downline Sales</span>
                            <span>
                                ${parseFloat(stats.downlineSalesTotal).toLocaleString()} / $
                                {parseFloat(stats.downlineSalesTotal + nextRankReqs.downlineNeeded).toLocaleString()}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progressToNext.downline}%` }}
                            ></div>
                        </div>
                        <span className="progress-remaining">
                            ${parseFloat(nextRankReqs.downlineNeeded).toLocaleString()} remaining
                        </span>
                    </div>

                    <div className="progress-item">
                        <div className="progress-header">
                            <span>Self Sales</span>
                            <span>
                                ${parseFloat(stats.selfSalesTotal).toLocaleString()} / $
                                {parseFloat(stats.selfSalesTotal + nextRankReqs.selfNeeded).toLocaleString()}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progressToNext.self}%` }}
                            ></div>
                        </div>
                        <span className="progress-remaining">
                            ${parseFloat(nextRankReqs.selfNeeded).toLocaleString()} remaining
                        </span>
                    </div>

                    <div className="next-rank-rewards">
                        <p>
                            Reach {getRankName(nextRankReqs.nextRank)} to earn{' '}
                            <strong>{getCommissionRate(nextRankReqs.nextRank)}%</strong> commission!
                        </p>
                    </div>
                </div>
            )}

            {rankName === 'Gold' && (
                <div className="max-rank">
                    <h3>🏆 Maximum Rank Achieved!</h3>
                    <p>You're earning the highest commission rate of 20%</p>
                </div>
            )}

            {/* How It Works */}
            <div className="affiliate-info">
                <h3>📚 How It Works</h3>
                <ol>
                    <li>Share your affiliate link with friends and community</li>
                    <li>Earn commission when they purchase fractions</li>
                    <li>Upgrade your rank to earn higher commissions</li>
                    <li>Claim your commissions in USDC anytime</li>
                </ol>

                <div className="rank-table">
                    <h4>Rank Requirements & Commission Rates</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Downline Sales</th>
                                <th>Self Sales</th>
                                <th>Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>⚪ Starter</td>
                                <td>$0</td>
                                <td>$0</td>
                                <td>5%</td>
                            </tr>
                            <tr>
                                <td>🟤 Bronze</td>
                                <td>$1,000</td>
                                <td>$100</td>
                                <td>10%</td>
                            </tr>
                            <tr>
                                <td>⚪ Silver</td>
                                <td>$10,000</td>
                                <td>$1,000</td>
                                <td>15%</td>
                            </tr>
                            <tr>
                                <td>🟡 Gold</td>
                                <td>$100,000</td>
                                <td>$5,000</td>
                                <td>20%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Helper functions
function getRankName(rankNumber) {
    const ranks = ['Starter', 'Bronze', 'Silver', 'Gold'];
    return ranks[rankNumber] || 'Unknown';
}

function getCommissionRate(rankNumber) {
    const rates = [5, 10, 15, 20];
    return rates[rankNumber] || 0;
}

function getRankEmoji(rankName) {
    const emojis = {
        'Starter': '⚪',
        'Bronze': '🟤',
        'Silver': '⚪',
        'Gold': '🟡',
    };
    return emojis[rankName] || '⚪';
}

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FaTwitter, FaFacebook, FaTelegram, FaWhatsapp, FaLinkedin, FaCopy, FaTrophy, FaRocket, FaStar } from 'react-icons/fa';
import './EnhancedAffiliatePanel.css';

export function EnhancedAffiliatePanel() {
    const { address } = useAccount();
    const [affiliateData, setAffiliateData] = useState({
        // Basic Stats
        referralCode: 'IONX' + address?.slice(2, 8).toUpperCase(),
        totalReferrals: 47,
        activeReferrals: 32,
        totalEarnings: 25840.50,
        pendingEarnings: 3250.75,

        // Performance
        currentRank: 'Silver',
        nextRank: 'Gold',
        progressToNextRank: 65,

        // Sales Metrics
        totalSales: 185000,
        monthlyVolume: 42000,
        conversionRate: 23.5,

        // Achievements
        achievements: [
            { id: 1, name: 'First Referral', earned: true, icon: '🎯', reward: '50 IONX' },
            { id: 2, name: '10 Referrals', earned: true, icon: '🔥', reward: '500 IONX' },
            { id: 3, name: '50 Referrals', earned: false, icon: '⭐', reward: '2,500 IONX', progress: 47 / 50 },
            { id: 4, name: '$100k Volume', earned: true, icon: '💰', reward: '1,000 IONX' },
            { id: 5, name: '$500k Volume', earned: false, icon: '💎', reward: '5,000 IONX', progress: 185000 / 500000 },
            { id: 6, name: 'Top 10 Affiliate', earned: false, icon: '🏆', reward: '10,000 IONX', currentRank: 15 }
        ],

        // Targets
        weeklyTarget: { current: 8500, goal: 10000 },
        monthlyTarget: { current: 42000, goal: 50000 }
    });

    const [copiedLink, setCopiedLink] = useState(false);
    const affiliateLink = `https://ionova.network/buy?ref=${affiliateData.referralCode}`;

    // Copy referral link
    const copyLink = () => {
        navigator.clipboard.writeText(affiliateLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Social media sharing
    const shareToSocial = (platform) => {
        const message = encodeURIComponent(`🚀 Join me on Ionova! Buy validator fractions and earn rewards. Use my link: ${affiliateLink}`);
        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${message}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${affiliateLink}`,
            telegram: `https://t.me/share/url?url=${affiliateLink}&text=${message}`,
            whatsapp: `https://wa.me/?text=${message}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${affiliateLink}`
        };

        window.open(urls[platform], '_blank', 'width=600,height=400');
    };

    return (
        <div className="enhanced-affiliate-panel">
            {/* Header */}
            <header className="affiliate-header">
                <div className="header-content">
                    <h1>🚀 Affiliate Dashboard</h1>
                    <div className="rank-badge rank-{affiliateData.currentRank.toLowerCase()}">
                        <FaStar /> {affiliateData.currentRank} Affiliate
                    </div>
                </div>
            </header>

            {/* Quick Stats */}
            <section className="quick-stats">
                <div className="stat-card earnings">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Earnings</div>
                        <div className="stat-value">${affiliateData.totalEarnings.toLocaleString()}</div>
                        <div className="stat-subtext">+${affiliateData.pendingEarnings.toLocaleString()} pending</div>
                    </div>
                </div>

                <div className="stat-card referrals">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Referrals</div>
                        <div className="stat-value">{affiliateData.totalReferrals}</div>
                        <div className="stat-subtext">{affiliateData.activeReferrals} active this month</div>
                    </div>
                </div>

                <div className="stat-card volume">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Volume</div>
                        <div className="stat-value">${(affiliateData.totalSales / 1000).toFixed(0)}k</div>
                        <div className="stat-subtext">${(affiliateData.monthlyVolume / 1000).toFixed(0)}k this month</div>
                    </div>
                </div>

                <div className="stat-card conversion">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-info">
                        <div className="stat-label">Conversion Rate</div>
                        <div className="stat-value">{affiliateData.conversionRate}%</div>
                        <div className="stat-subtext">Above average!</div>
                    </div>
                </div>
            </section>

            {/* Referral Link & Sharing */}
            <section className="referral-section">
                <h2>📢 Share Your Referral Link</h2>

                <div className="referral-link-box">
                    <input
                        type="text"
                        value={affiliateLink}
                        readOnly
                        className="referral-input"
                    />
                    <button
                        className={`copy-btn ${copiedLink ? 'copied' : ''}`}
                        onClick={copyLink}
                    >
                        <FaCopy /> {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="social-share">
                    <h3>Share on Social Media:</h3>
                    <div className="social-buttons">
                        <button
                            className="social-btn twitter"
                            onClick={() => shareToSocial('twitter')}
                        >
                            <FaTwitter /> Twitter
                        </button>
                        <button
                            className="social-btn facebook"
                            onClick={() => shareToSocial('facebook')}
                        >
                            <FaFacebook /> Facebook
                        </button>
                        <button
                            className="social-btn telegram"
                            onClick={() => shareToSocial('telegram')}
                        >
                            <FaTelegram /> Telegram
                        </button>
                        <button
                            className="social-btn whatsapp"
                            onClick={() => shareToSocial('whatsapp')}
                        >
                            <FaWhatsapp /> WhatsApp
                        </button>
                        <button
                            className="social-btn linkedin"
                            onClick={() => shareToSocial('linkedin')}
                        >
                            <FaLinkedin /> LinkedIn
                        </button>
                    </div>
                </div>
            </section>

            {/* Rank Progress */}
            <section className="rank-progress-section">
                <h2>🎯 Rank Progress</h2>
                <div className="rank-progress-card">
                    <div className="current-next-ranks">
                        <div className="rank-item current">
                            <div className="rank-icon">🥈</div>
                            <div className="rank-name">{affiliateData.currentRank}</div>
                            <div className="rank-commission">10-15% Commission</div>
                        </div>

                        <div className="rank-arrow">→</div>

                        <div className="rank-item next">
                            <div className="rank-icon">🥇</div>
                            <div className="rank-name">{affiliateData.nextRank}</div>
                            <div className="rank-commission">15-20% Commission</div>
                        </div>
                    </div>

                    <div className="progress-info">
                        <div className="progress-label">
                            Progress to {affiliateData.nextRank}
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${affiliateData.progressToNextRank}%` }}
                            >
                                <span className="progress-percentage">{affiliateData.progressToNextRank}%</span>
                            </div>
                        </div>
                        <div className="progress-requirements">
                            <div>✅ 30 referrals (you have {affiliateData.totalReferrals})</div>
                            <div>⏳ $200k volume (you have ${(affiliateData.totalSales / 1000).toFixed(0)}k)</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="achievements-section">
                <h2>🏆 Achievements & Rewards</h2>
                <div className="achievements-grid">
                    {affiliateData.achievements.map(achievement => (
                        <div
                            key={achievement.id}
                            className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
                        >
                            <div className="achievement-icon">{achievement.icon}</div>
                            <div className="achievement-name">{achievement.name}</div>
                            <div className="achievement-reward">
                                {achievement.earned ? (
                                    <span className="earned-badge">✅ Earned!</span>
                                ) : achievement.progress ? (
                                    <div className="achievement-progress">
                                        <div className="progress-bar-mini">
                                            <div
                                                className="progress-fill-mini"
                                                style={{ width: `${achievement.progress * 100}%` }}
                                            />
                                        </div>
                                        <span>{Math.round(achievement.progress * 100)}% Complete</span>
                                    </div>
                                ) : (
                                    <span className="locked-badge">🔒 Locked</span>
                                )}
                            </div>
                            <div className="achievement-prize">{achievement.reward}</div>
                            {achievement.currentRank && (
                                <div className="achievement-rank">Current rank: #{achievement.currentRank}</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Performance Targets */}
            <section className="targets-section">
                <h2>🎯 Performance Targets</h2>

                <div className="targets-grid">
                    <div className="target-card">
                        <h3>📅 Weekly Target</h3>
                        <div className="target-amount">
                            ${affiliateData.weeklyTarget.current.toLocaleString()} /
                            ${affiliateData.weeklyTarget.goal.toLocaleString()}
                        </div>
                        <div className="target-progress-bar">
                            <div
                                className="target-progress-fill"
                                style={{ width: `${(affiliateData.weeklyTarget.current / affiliateData.weeklyTarget.goal) * 100}%` }}
                            />
                        </div>
                        <div className="target-status">
                            ${(affiliateData.weeklyTarget.goal - affiliateData.weeklyTarget.current).toLocaleString()} to go
                        </div>
                    </div>

                    <div className="target-card">
                        <h3>📆 Monthly Target</h3>
                        <div className="target-amount">
                            ${affiliateData.monthlyTarget.current.toLocaleString()} /
                            ${affiliateData.monthlyTarget.goal.toLocaleString()}
                        </div>
                        <div className="target-progress-bar">
                            <div
                                className="target-progress-fill"
                                style={{ width: `${(affiliateData.monthlyTarget.current / affiliateData.monthlyTarget.goal) * 100}%` }}
                            />
                        </div>
                        <div className="target-status">
                            ${(affiliateData.monthlyTarget.goal - affiliateData.monthlyTarget.current).toLocaleString()} to go
                        </div>
                    </div>
                </div>

                <div className="target-rewards">
                    <h4>🎁 Target Bonuses:</h4>
                    <ul>
                        <li>Complete weekly target: <strong>+250 IONX bonus</strong></li>
                        <li>Complete monthly target: <strong>+1,500 IONX bonus</strong></li>
                        <li>Beat monthly target by 20%: <strong>+3,000 IONX bonus</strong></li>
                    </ul>
                </div>
            </section>

            {/* Top Affiliates Leaderboard */}
            <section className="leaderboard-section">
                <h2>🏆 Top Affiliates This Month</h2>
                <div className="leaderboard-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Affiliate</th>
                                <th>Referrals</th>
                                <th>Volume</th>
                                <th>Earnings</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="top-1">
                                <td><div className="rank-medal">🥇</div></td>
                                <td>0x742d...9a3f</td>
                                <td>127</td>
                                <td>$675k</td>
                                <td>$67,500</td>
                            </tr>
                            <tr className="top-2">
                                <td><div className="rank-medal">🥈</div></td>
                                <td>0x853f...2b1c</td>
                                <td>98</td>
                                <td>$542k</td>
                                <td>$54,200</td>
                            </tr>
                            <tr className="top-3">
                                <td><div className="rank-medal">🥉</div></td>
                                <td>0x421a...8d4e</td>
                                <td>84</td>
                                <td>$458k</td>
                                <td>$45,800</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>0x639c...5f7a</td>
                                <td>76</td>
                                <td>$412k</td>
                                <td>$41,200</td>
                            </tr>
                            <tr className="current-user">
                                <td>15</td>
                                <td>You</td>
                                <td>{affiliateData.totalReferrals}</td>
                                <td>${(affiliateData.totalSales / 1000).toFixed(0)}k</td>
                                <td>${(affiliateData.totalEarnings / 1000).toFixed(1)}k</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Marketing Materials */}
            <section className="marketing-section">
                <h2>📱 Marketing Materials</h2>
                <div className="marketing-grid">
                    <div className="marketing-card">
                        <h3>🎨 Social Media Graphics</h3>
                        <p>Download ready-to-share images for your posts</p>
                        <button className="download-btn">Download Pack</button>
                    </div>

                    <div className="marketing-card">
                        <h3>📝 Copy Templates</h3>
                        <p>Pre-written posts for Twitter, Facebook & more</p>
                        <button className="download-btn">View Templates</button>
                    </div>

                    <div className="marketing-card">
                        <h3>🎬 Video Explainers</h3>
                        <p>Short videos explaining Ionova to share</p>
                        <button className="download-btn">Get Videos</button>
                    </div>

                    <div className="marketing-card">
                        <h3>📊 Stats & Infographics</h3>
                        <p>Data visualizations to showcase Ionova</p>
                        <button className="download-btn">Download</button>
                    </div>
                </div>
            </section>

            {/* Recent Referrals */}
            <section className="recent-referrals-section">
                <h2>👥 Recent Referrals</h2>
                <div className="referrals-list">
                    {[
                        { address: '0x742d...9a3f', amount: 150, earnings: 22.50, time: '2 hours ago' },
                        { address: '0x853f...2b1c', amount: 500, earnings: 90.00, time: '5 hours ago' },
                        { address: '0x421a...8d4e', amount: 75, earnings: 11.25, time: '1 day ago' },
                        { address: '0x639c...5f7a', amount: 1200, earnings: 240.00, time: '2 days ago' }
                    ].map((ref, i) => (
                        <div key={i} className="referral-item">
                            <div className="referral-address">{ref.address}</div>
                            <div className="referral-amount">{ref.amount} fractions</div>
                            <div className="referral-earnings">+${ref.earnings}</div>
                            <div className="referral-time">{ref.time}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default EnhancedAffiliatePanel;

import React, { useState, useEffect } from 'react';
import { useContract, useProvider } from 'wagmi';
import './Leaderboard.css';

const LEADERBOARD_TYPES = {
    TOP_HOLDERS: 0,
    TOP_BUYERS: 1,
    TOP_SPENDERS: 2,
    TOP_AFFILIATES: 3,
    TOP_REWARD_EARNERS: 4,
    EARLY_BIRDS: 5,
    WHALE_WATCHERS: 6
};

const Leaderboard = ({ contractAddress, abi }) => {
    const [activeTab, setActiveTab] = useState('holders');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [stats, setStats] = useState(null);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const provider = useProvider();
    const contract = useContract({
        address: contractAddress,
        abi: abi,
        signerOrProvider: provider
    });

    const tabs = [
        { id: 'holders', label: '🏆 Top Holders', type: LEADERBOARD_TYPES.TOP_HOLDERS },
        { id: 'spenders', label: '💰 Top Spenders', type: LEADERBOARD_TYPES.TOP_SPENDERS },
        { id: 'affiliates', label: '🤝 Top Affiliates', type: LEADERBOARD_TYPES.TOP_AFFILIATES },
        { id: 'rewards', label: '🎁 Top Earners', type: LEADERBOARD_TYPES.TOP_REWARD_EARNERS },
        { id: 'whales', label: '🐋 Whale Watch', type: LEADERBOARD_TYPES.WHALE_WATCHERS }
    ];

    useEffect(() => {
        loadLeaderboard();
        loadStats();
        const interval = setInterval(loadLeaderboard, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [activeTab]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const currentTab = tabs.find(t => t.id === activeTab);
            const data = await contract.getTopN(currentTab.type, 100);

            const formatted = data.map((entry, index) => ({
                rank: index + 1,
                address: entry.user,
                username: entry.username || `User ${entry.user.slice(0, 6)}...`,
                value: parseFloat(entry.value.toString()),
                timestamp: new Date(entry.timestamp.toNumber() * 1000),
                isVerified: false // Would check verification status
            }));

            setLeaderboardData(formatted);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await contract.getLeaderboardStats();
            setStats({
                totalEntries: statsData.totalEntries.toNumber(),
                totalHolders: statsData.totalHolders.toNumber(),
                totalAffiliates: statsData.totalAffiliates.toNumber(),
                avgHoldings: parseInt(statsData.avgHoldings.toString()),
                records: {
                    largestPurchase: {
                        holder: statsData.largestPurchase.holder,
                        value: parseFloat(statsData.largestPurchase.value.toString()),
                        timestamp: new Date(statsData.largestPurchase.timestamp.toNumber() * 1000)
                    },
                    topHolder: {
                        holder: statsData.topHolder.holder,
                        value: parseFloat(statsData.topHolder.value.toString()),
                        timestamp: new Date(statsData.topHolder.timestamp.toNumber() * 1000)
                    },
                    topAffiliate: {
                        holder: statsData.topAffiliate.holder,
                        value: parseFloat(statsData.topAffiliate.value.toString()),
                        timestamp: new Date(statsData.topAffiliate.timestamp.toNumber() * 1000)
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const formatValue = (value, type) => {
        switch (type) {
            case 'holders':
                return `${value.toLocaleString()} fractions`;
            case 'spenders':
                return `$${(value / 1e6).toLocaleString()}`;
            case 'affiliates':
                return `$${(value / 1e6).toLocaleString()}`;
            case 'rewards':
                return `${(value / 1e18).toLocaleString()} IONX`;
            case 'whales':
                return `${value.toLocaleString()} fractions`;
            default:
                return value.toLocaleString();
        }
    };

    const getEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="leaderboard-container">
            {/* Header with Stats */}
            <div className="leaderboard-header">
                <h1>🏆 Validator Sale Leaderboards</h1>

                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalHolders.toLocaleString()}</div>
                            <div className="stat-label">Total Participants</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.avgHoldings.toLocaleString()}</div>
                            <div className="stat-label">Avg Holdings</div>
                        </div>
                        <div className="stat-card highlight">
                            <div className="stat-value">
                                {stats.records.topHolder.value.toLocaleString()}
                            </div>
                            <div className="stat-label">🏆 Record Holdings</div>
                            <div className="stat-holder">
                                {stats.records.topHolder.holder.slice(0, 10)}...
                            </div>
                        </div>
                        <div className="stat-card highlight">
                            <div className="stat-value">
                                ${(stats.records.topAffiliate.value / 1e6).toLocaleString()}
                            </div>
                            <div className="stat-label">🤝 Record Commission</div>
                            <div className="stat-holder">
                                {stats.records.topAffiliate.holder.slice(0, 10)}...
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="leaderboard-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="leaderboard-content">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading leaderboard...</p>
                    </div>
                ) : (
                    <div className="leaderboard-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>User</th>
                                    <th>Value</th>
                                    <th>Since</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((entry) => (
                                    <tr
                                        key={entry.rank}
                                        className={entry.rank <= 3 ? 'podium' : ''}
                                    >
                                        <td className="rank">
                                            <span className="rank-badge">{getEmoji(entry.rank)}</span>
                                        </td>
                                        <td className="user">
                                            <div className="user-info">
                                                <span className="username">
                                                    {entry.username}
                                                    {entry.isVerified && <span className="verified">✓</span>}
                                                </span>
                                                <span className="address">{entry.address.slice(0, 10)}...</span>
                                            </div>
                                        </td>
                                        <td className="value">
                                            <strong>{formatValue(entry.value, activeTab)}</strong>
                                        </td>
                                        <td className="timestamp">
                                            {entry.timestamp.toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}

                                {leaderboardData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="empty">
                                            No entries yet. Be the first!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Rank Card */}
            {userRank && (
                <div className="user-rank-card">
                    <h3>Your Ranking</h3>
                    <div className="rank-details">
                        <div className="rank-number">#{userRank.rank}</div>
                        <div className="rank-value">{formatValue(userRank.value, activeTab)}</div>
                    </div>
                </div>
            )}

            {/* Live Feed */}
            <div className="live-feed">
                <h3>🔴 Live Updates</h3>
                <div className="feed-items">
                    {/* Would show recent transactions/updates */}
                    <div className="feed-item">
                        <span className="time">2m ago</span>
                        <span className="event">🐋 New whale purchase: 5,000 fractions!</span>
                    </div>
                    <div className="feed-item">
                        <span className="time">5m ago</span>
                        <span className="event">🏆 New #1 holder with 150,000 fractions!</span>
                    </div>
                    <div className="feed-item">
                        <span className="time">8m ago</span>
                        <span className="event">🤝 Affiliate reached Gold rank!</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;

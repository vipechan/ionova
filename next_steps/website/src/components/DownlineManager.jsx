import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronRight, FaDownload, FaFilter } from 'react-icons/fa';
import './DownlineManager.css';

export function DownlineManager() {
    const [view, setView] = useState('tree'); // 'tree' or 'list'
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [filters, setFilters] = useState({
        minVolume: 0,
        level: 'all',
        status: 'all'
    });

    const [downlineData, setDownlineData] = useState({
        // Your direct referrals (Level 1)
        level1: [
            {
                address: '0x742d35...9a3f',
                name: 'User Alpha',
                joinDate: '2024-11-15',
                totalVolume: 45000,
                fractionsPurchased: 850,
                commission: {
                    level1: 2250,  // 5% of 45k
                    level2: 1800,  // from their downline
                    level3: 900,
                    level4: 450,
                    total: 5400
                },
                status: 'active',
                lastPurchase: '2024-12-07',
                downline: [
                    {
                        address: '0x853f21...2b1c',
                        name: 'User Beta',
                        joinDate: '2024-11-20',
                        totalVolume: 32000,
                        fractionsPurchased: 620,
                        commission: {
                            level2: 1600,
                            level3: 800,
                            level4: 400,
                            total: 2800
                        },
                        status: 'active',
                        lastPurchase: '2024-12-06',
                        downline: [
                            {
                                address: '0x421a67...8d4e',
                                totalVolume: 18000,
                                fractionsPurchased: 350,
                                commission: {
                                    level3: 900,
                                    level4: 450,
                                    total: 1350
                                },
                                status: 'active',
                                downline: [
                                    {
                                        address: '0x639c94...5f7a',
                                        totalVolume: 12000,
                                        fractionsPurchased: 240,
                                        commission: {
                                            level4: 600,
                                            total: 600
                                        },
                                        status: 'active'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                address: '0x958b42...3c2d',
                name: 'User Gamma',
                joinDate: '2024-11-18',
                totalVolume: 28000,
                fractionsPurchased: 550,
                commission: {
                    level1: 1400,
                    level2: 900,
                    total: 2300
                },
                status: 'active',
                lastPurchase: '2024-12-05',
                downline: [
                    {
                        address: '0x743e51...6d8f',
                        totalVolume: 15000,
                        fractionsPurchased: 300,
                        commission: {
                            level2: 750,
                            level3: 450,
                            total: 1200
                        },
                        status: 'active'
                    }
                ]
            }
            // More level 1 referrals...
        ]
    });

    // Calculate total stats
    const calculateTotalStats = () => {
        let totalReferrals = 0;
        let totalVolume = 0;
        let totalCommission = 0;
        let byLevel = { 1: 0, 2: 0, 3: 0, 4: 0 };

        const traverse = (nodes, level = 1) => {
            nodes.forEach(node => {
                totalReferrals++;
                totalVolume += node.totalVolume;
                totalCommission += node.commission.total;
                byLevel[level]++;

                if (node.downline) {
                    traverse(node.downline, level + 1);
                }
            });
        };

        traverse(downlineData.level1);

        return { totalReferrals, totalVolume, totalCommission, byLevel };
    };

    const stats = calculateTotalStats();

    // Toggle node expansion
    const toggleNode = (address) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(address)) {
            newExpanded.delete(address);
        } else {
            newExpanded.add(address);
        }
        setExpandedNodes(newExpanded);
    };

    // Render tree node
    const renderTreeNode = (node, level = 1) => {
        const hasChildren = node.downline && node.downline.length > 0;
        const isExpanded = expandedNodes.has(node.address);
        const levelColor = ['#667eea', '#764ba2', '#f59e0b', '#ef4444'][level - 1];

        return (
            <div key={node.address} className="tree-node">
                <div className={`node-content level-${level}`} style={{ borderLeftColor: levelColor }}>
                    {hasChildren && (
                        <button
                            className="expand-btn"
                            onClick={() => toggleNode(node.address)}
                        >
                            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                    )}

                    <div className="node-info">
                        <div className="node-header">
                            <span className="node-address">{node.address}</span>
                            {node.name && <span className="node-name">({node.name})</span>}
                            <span className={`node-status status-${node.status}`}>{node.status}</span>
                            <span className="node-level">Level {level}</span>
                        </div>

                        <div className="node-stats">
                            <div className="node-stat">
                                <span className="stat-label">Volume:</span>
                                <span className="stat-value">${node.totalVolume.toLocaleString()}</span>
                            </div>
                            <div className="node-stat">
                                <span className="stat-label">Fractions:</span>
                                <span className="stat-value">{node.fractionsPurchased}</span>
                            </div>
                            <div className="node-stat">
                                <span className="stat-label">Your Commission:</span>
                                <span className="stat-value commission">${node.commission.total.toLocaleString()}</span>
                            </div>
                            <div className="node-stat">
                                <span className="stat-label">Joined:</span>
                                <span className="stat-value">{node.joinDate}</span>
                            </div>
                            {node.lastPurchase && (
                                <div className="node-stat">
                                    <span className="stat-label">Last Purchase:</span>
                                    <span className="stat-value">{node.lastPurchase}</span>
                                </div>
                            )}
                        </div>

                        <div className="commission-breakdown">
                            {Object.entries(node.commission).map(([key, value]) => {
                                if (key === 'total') return null;
                                return (
                                    <div key={key} className="commission-item">
                                        <span>{key.replace('level', 'L')}: ${value.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="node-children">
                        {node.downline.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Flatten tree for list view
    const flattenTree = (nodes, level = 1) => {
        let result = [];
        nodes.forEach(node => {
            result.push({ ...node, level });
            if (node.downline) {
                result = [...result, ...flattenTree(node.downline, level + 1)];
            }
        });
        return result;
    };

    // Export data
    const exportData = () => {
        const flatData = flattenTree(downlineData.level1);
        const csv = [
            ['Address', 'Name', 'Level', 'Volume', 'Fractions', 'Commission', 'Status', 'Joined', 'Last Purchase'],
            ...flatData.map(node => [
                node.address,
                node.name || '',
                node.level,
                node.totalVolume,
                node.fractionsPurchased,
                node.commission.total,
                node.status,
                node.joinDate || '',
                node.lastPurchase || ''
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `downline-${Date.now()}.csv`;
        a.click();
    };

    return (
        <div className="downline-manager">
            <header className="downline-header">
                <h1>👥 Your Downline Network</h1>
                <div className="header-actions">
                    <button
                        className={`view-toggle ${view === 'tree' ? 'active' : ''}`}
                        onClick={() => setView('tree')}
                    >
                        🌳 Tree View
                    </button>
                    <button
                        className={`view-toggle ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        📋 List View
                    </button>
                    <button className="export-btn" onClick={exportData}>
                        <FaDownload /> Export CSV
                    </button>
                </div>
            </header>

            {/* Summary Stats */}
            <section className="summary-stats">
                <div className="summary-card">
                    <div className="summary-icon">👥</div>
                    <div className="summary-info">
                        <div className="summary-label">Total Network</div>
                        <div className="summary-value">{stats.totalReferrals}</div>
                        <div className="summary-breakdown">
                            L1: {stats.byLevel[1]} · L2: {stats.byLevel[2]} ·
                            L3: {stats.byLevel[3]} · L4: {stats.byLevel[4]}
                        </div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">📊</div>
                    <div className="summary-info">
                        <div className="summary-label">Network Volume</div>
                        <div className="summary-value">${stats.totalVolume.toLocaleString()}</div>
                        <div className="summary-breakdown">Combined sales from all levels</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">💰</div>
                    <div className="summary-info">
                        <div className="summary-label">Total Commissions</div>
                        <div className="summary-value">${stats.totalCommission.toLocaleString()}</div>
                        <div className="summary-breakdown">Earnings from entire network</div>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className="filters-section">
                <div className="filter-group">
                    <label>Min Volume:</label>
                    <input
                        type="number"
                        value={filters.minVolume}
                        onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
                        placeholder="$0"
                    />
                </div>

                <div className="filter-group">
                    <label>Level:</label>
                    <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    >
                        <option value="all">All Levels</option>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                        <option value="4">Level 4</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Status:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </section>

            {/* Tree View */}
            {view === 'tree' && (
                <section className="tree-view">
                    <div className="tree-container">
                        {downlineData.level1.map(node => renderTreeNode(node, 1))}
                    </div>
                </section>
            )}

            {/* List View */}
            {view === 'list' && (
                <section className="list-view">
                    <table className="downline-table">
                        <thead>
                            <tr>
                                <th>Level</th>
                                <th>Address</th>
                                <th>Name</th>
                                <th>Volume</th>
                                <th>Fractions</th>
                                <th>Commission</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Last Purchase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flattenTree(downlineData.level1).map((node, i) => (
                                <tr key={i} className={`level-row-${node.level}`}>
                                    <td><span className={`level-badge level-${node.level}`}>L{node.level}</span></td>
                                    <td className="address-cell">{node.address}</td>
                                    <td>{node.name || '-'}</td>
                                    <td className="amount-cell">${node.totalVolume.toLocaleString()}</td>
                                    <td className="amount-cell">{node.fractionsPurchased}</td>
                                    <td className="commission-cell">${node.commission.total.toLocaleString()}</td>
                                    <td><span className={`status-badge ${node.status}`}>{node.status}</span></td>
                                    <td className="date-cell">{node.joinDate || '-'}</td>
                                    <td className="date-cell">{node.lastPurchase || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Commission History */}
            <section className="commission-history">
                <h2>📜 Commission History</h2>
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Referral</th>
                            <th>Level</th>
                            <th>Purchase Amount</th>
                            <th>Commission Rate</th>
                            <th>Commission Earned</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2024-12-07 14:30</td>
                            <td>0x742d35...9a3f</td>
                            <td><span className="level-badge level-1">L1</span></td>
                            <td>$2,500</td>
                            <td>5%</td>
                            <td className="commission-amount">$125.00</td>
                            <td><span className="status-badge paid">Paid</span></td>
                        </tr>
                        <tr>
                            <td>2024-12-06 09:15</td>
                            <td>0x853f21...2b1c</td>
                            <td><span className="level-badge level-2">L2</span></td>
                            <td>$1,800</td>
                            <td>3%</td>
                            <td className="commission-amount">$54.00</td>
                            <td><span className="status-badge paid">Paid</span></td>
                        </tr>
                        <tr>
                            <td>2024-12-05 16:45</td>
                            <td>0x958b42...3c2d</td>
                            <td><span className="level-badge level-1">L1</span></td>
                            <td>$3,200</td>
                            <td>5%</td>
                            <td className="commission-amount">$160.00</td>
                            <td><span className="status-badge paid">Paid</span></td>
                        </tr>
                        <tr>
                            <td>2024-12-04 11:20</td>
                            <td>0x421a67...8d4e</td>
                            <td><span className="level-badge level-3">L3</span></td>
                            <td>$1,500</td>
                            <td>2%</td>
                            <td className="commission-amount">$30.00</td>
                            <td><span className="status-badge pending">Pending</span></td>
                        </tr>
                        <tr>
                            <td>2024-12-03 13:50</td>
                            <td>0x743e51...6d8f</td>
                            <td><span className="level-badge level-2">L2</span></td>
                            <td>$2,100</td>
                            <td>3%</td>
                            <td className="commission-amount">$63.00</td>
                            <td><span className="status-badge paid">Paid</span></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Level Commission Rates */}
            <section className="commission-rates">
                <h2>💎 Commission Structure</h2>
                <div className="rates-grid">
                    <div className="rate-card level-1-card">
                        <div className="rate-level">Level 1</div>
                        <div className="rate-percentage">5%</div>
                        <div className="rate-description">Direct referrals</div>
                        <div className="rate-example">Example: $1,000 sale = $50 commission</div>
                    </div>

                    <div className="rate-card level-2-card">
                        <div className="rate-level">Level 2</div>
                        <div className="rate-percentage">3%</div>
                        <div className="rate-description">Referrals of your referrals</div>
                        <div className="rate-example">Example: $1,000 sale = $30 commission</div>
                    </div>

                    <div className="rate-card level-3-card">
                        <div className="rate-level">Level 3</div>
                        <div className="rate-percentage">2%</div>
                        <div className="rate-description">Third level down</div>
                        <div className="rate-example">Example: $1,000 sale = $20 commission</div>
                    </div>

                    <div className="rate-card level-4-card">
                        <div className="rate-level">Level 4</div>
                        <div className="rate-percentage">1%</div>
                        <div className="rate-description">Fourth level down</div>
                        <div className="rate-example">Example: $1,000 sale = $10 commission</div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default DownlineManager;

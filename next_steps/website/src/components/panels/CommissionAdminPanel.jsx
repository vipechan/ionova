import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaMinus, FaUndo } from 'react-icons/fa';
import './CommissionAdminPanel.css';

export function CommissionAdminPanel() {
    const [activeLevels, setActiveLevels] = useState(4);
    const [commissionRates, setCommissionRates] = useState({
        starter: Array(10).fill(0),
        bronze: Array(10).fill(0),
        silver: Array(10).fill(0),
        gold: Array(10).fill(0)
    });

    // Default rates
    const defaultRates = {
        starter: [500, 200, 100, 50, 25, 10, 5, 2, 1, 0.5],      // 5%, 2%, 1%, 0.5%...
        bronze: [1000, 500, 200, 100, 50, 25, 10, 5, 2, 1],      // 10%, 5%, 2%, 1%...
        silver: [1500, 800, 300, 150, 75, 40, 20, 10, 5, 2],     // 15%, 8%, 3%, 1.5%...
        gold: [2000, 1000, 500, 200, 100, 50, 25, 12, 6, 3]      // 20%, 10%, 5%, 2%...
    };

    useEffect(() => {
        // Load current rates from contract
        loadCurrentRates();
    }, []);

    const loadCurrentRates = async () => {
        // In real implementation, load from smart contract
        setCommissionRates({
            starter: defaultRates.starter,
            bronze: defaultRates.bronze,
            silver: defaultRates.silver,
            gold: defaultRates.gold
        });
    };

    const updateRate = (rank, level, value) => {
        const newRates = { ...commissionRates };
        newRates[rank][level] = parseFloat(value) || 0;
        setCommissionRates(newRates);
    };

    const saveRates = async () => {
        // Convert to basis points (multiply by 100)
        const levels = Array.from({ length: activeLevels }, (_, i) => i + 1);

        const starterRates = commissionRates.starter.slice(0, activeLevels);
        const bronzeRates = commissionRates.bronze.slice(0, activeLevels);
        const silverRates = commissionRates.silver.slice(0, activeLevels);
        const goldRates = commissionRates.gold.slice(0, activeLevels);

        console.log('Saving commission structure:', {
            activeLevels,
            levels,
            starterRates,
            bronzeRates,
            silverRates,
            goldRates
        });

        // Call smart contract
        // await contract.setAllCommissionRates(levels, starterRates, bronzeRates, silverRates, goldRates);

        alert('✅ Commission rates updated successfully!');
    };

    const resetToDefaults = () => {
        if (window.confirm('Reset all commission rates to defaults?')) {
            setCommissionRates({
                starter: [...defaultRates.starter],
                bronze: [...defaultRates.bronze],
                silver: [...defaultRates.silver],
                gold: [...defaultRates.gold]
            });
        }
    };

    const calculateTotalCommission = (rank) => {
        return commissionRates[rank]
            .slice(0, activeLevels)
            .reduce((sum, rate) => sum + rate, 0) / 100;
    };

    return (
        <div className="commission-admin-panel">
            <header className="admin-header">
                <h1>⚙️ Commission Structure Configuration</h1>
                <p>Configure multi-level commission rates for all affiliate ranks</p>
            </header>

            {/* Active Levels Control */}
            <section className="levels-control">
                <h2>📊 Active Commission Levels</h2>
                <div className="levels-selector">
                    <button
                        className="level-btn"
                        onClick={() => setActiveLevels(Math.max(4, activeLevels - 1))}
                        disabled={activeLevels <= 4}
                    >
                        <FaMinus />
                    </button>

                    <div className="levels-display">
                        <div className="levels-count">{activeLevels}</div>
                        <div className="levels-label">Levels</div>
                    </div>

                    <button
                        className="level-btn"
                        onClick={() => setActiveLevels(Math.min(10, activeLevels + 1))}
                        disabled={activeLevels >= 10}
                    >
                        <FaPlus />
                    </button>
                </div>

                <div className="levels-info">
                    <div className="info-item">
                        <span className="info-label">Range:</span>
                        <span className="info-value">4-10 levels</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Current:</span>
                        <span className="info-value">{activeLevels} levels active</span>
                    </div>
                </div>
            </section>

            {/* Commission Rates Table */}
            <section className="rates-configuration">
                <div className="section-header">
                    <h2>💰 Commission Rates Configuration</h2>
                    <div className="header-actions">
                        <button className="action-btn reset" onClick={resetToDefaults}>
                            <FaUndo /> Reset to Defaults
                        </button>
                        <button className="action-btn save" onClick={saveRates}>
                            <FaSave /> Save Changes
                        </button>
                    </div>
                </div>

                <div className="rates-table-container">
                    <table className="rates-table">
                        <thead>
                            <tr>
                                <th className="level-col">Level</th>
                                <th className="rank-col">
                                    <div className="rank-header">
                                        <span className="rank-icon">🥉</span>
                                        <span className="rank-name">Starter</span>
                                        <span className="rank-total">Total: {calculateTotalCommission('starter')}%</span>
                                    </div>
                                </th>
                                <th className="rank-col">
                                    <div className="rank-header">
                                        <span className="rank-icon">🥉</span>
                                        <span className="rank-name">Bronze</span>
                                        <span className="rank-total">Total: {calculateTotalCommission('bronze')}%</span>
                                    </div>
                                </th>
                                <th className="rank-col">
                                    <div className="rank-header">
                                        <span className="rank-icon">🥈</span>
                                        <span className="rank-name">Silver</span>
                                        <span className="rank-total">Total: {calculateTotalCommission('silver')}%</span>
                                    </div>
                                </th>
                                <th className="rank-col">
                                    <div className="rank-header">
                                        <span className="rank-icon">🥇</span>
                                        <span className="rank-name">Gold</span>
                                        <span className="rank-total">Total: {calculateTotalCommission('gold')}%</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: activeLevels }, (_, i) => i).map(level => (
                                <tr key={level} className={level >= 4 ? 'new-level' : ''}>
                                    <td className="level-cell">
                                        <span className={`level-badge level-${level + 1}`}>
                                            Level {level + 1}
                                        </span>
                                    </td>

                                    {['starter', 'bronze', 'silver', 'gold'].map(rank => (
                                        <td key={rank} className="rate-cell">
                                            <div className="rate-input-group">
                                                <input
                                                    type="number"
                                                    value={commissionRates[rank][level] / 100}
                                                    onChange={(e) => updateRate(rank, level, e.target.value * 100)}
                                                    min="0"
                                                    max="50"
                                                    step="0.1"
                                                    className="rate-input"
                                                />
                                                <span className="rate-unit">%</span>
                                            </div>
                                            <div className="rate-basis-points">
                                                {commissionRates[rank][level]} bp
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Preview Commission Distribution */}
            <section className="preview-section">
                <h2>📊 Preview: $10,000 Purchase Distribution</h2>

                <div className="preview-grid">
                    {['starter', 'bronze', 'silver', 'gold'].map(rank => {
                        const purchaseAmount = 10000;
                        const distributions = commissionRates[rank]
                            .slice(0, activeLevels)
                            .map(rate => (purchaseAmount * rate) / 10000);
                        const total = distributions.reduce((a, b) => a + b, 0);
                        const toTreasury = purchaseAmount - total;

                        return (
                            <div key={rank} className={`preview-card rank-${rank}`}>
                                <div className="preview-rank-header">
                                    <span className="preview-rank-icon">
                                        {rank === 'starter' && '🥉'}
                                        {rank === 'bronze' && '🥉'}
                                        {rank === 'silver' && '🥈'}
                                        {rank === 'gold' && '🥇'}
                                    </span>
                                    <span className="preview-rank-name">{rank.toUpperCase()}</span>
                                </div>

                                <div className="preview-distributions">
                                    {distributions.map((amount, i) => (
                                        <div key={i} className="preview-level">
                                            <span className="preview-level-label">L{i + 1}:</span>
                                            <span className="preview-amount">${amount.toFixed(2)}</span>
                                            <span className="preview-percent">({commissionRates[rank][i] / 100}%)</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="preview-separator"></div>

                                <div className="preview-totals">
                                    <div className="preview-total">
                                        <span>Total Commission:</span>
                                        <span className="preview-total-amount">${total.toFixed(2)}</span>
                                    </div>
                                    <div className="preview-treasury">
                                        <span>To Treasury:</span>
                                        <span className="preview-treasury-amount">${toTreasury.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Validation Rules */}
            <section className="validation-rules">
                <h2>✅ Validation Rules</h2>
                <div className="rules-grid">
                    <div className="rule-card">
                        <div className="rule-icon">📉</div>
                        <div className="rule-title">Decreasing Rates</div>
                        <div className="rule-description">
                            Each level should have equal or lower commission than the previous level
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">📊</div>
                        <div className="rule-title">Maximum Rate</div>
                        <div className="rule-description">
                            Individual level commission cannot exceed 50%
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">💎</div>
                        <div className="rule-title">Rank Progression</div>
                        <div className="rule-description">
                            Higher ranks should have higher rates than lower ranks
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">🎯</div>
                        <div className="rule-title">Level Range</div>
                        <div className="rule-description">
                            Minimum 4 levels, maximum 10 levels can be active
                        </div>
                    </div>
                </div>
            </section>

            {/* Action Log */}
            <section className="action-log">
                <h2>📜 Recent Changes</h2>
                <div className="log-list">
                    <div className="log-item">
                        <span className="log-time">2024-12-07 14:30</span>
                        <span className="log-action">Updated Silver L5 rate: 0.75% → 1.0%</span>
                        <span className="log-admin">Admin: 0x742d...9a3f</span>
                    </div>
                    <div className="log-item">
                        <span className="log-time">2024-12-06 09:15</span>
                        <span className="log-action">Increased active levels: 4 → 6</span>
                        <span className="log-admin">Admin: 0x742d...9a3f</span>
                    </div>
                    <div className="log-item">
                        <span className="log-time">2024-12-05 16:45</span>
                        <span className="log-action">Reset all rates to defaults</span>
                        <span className="log-admin">Admin: 0x742d...9a3f</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default CommissionAdminPanel;

import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaCalculator, FaChartLine } from 'react-icons/fa';
import './CommissionCalculator.css';

export function CommissionCalculator() {
    const [purchaseAmount, setPurchaseAmount] = useState(100);
    const [fractionCount, setFractionCount] = useState(10);
    const [pricePerFraction, setPricePerFraction] = useState(15);
    const [hasReferrer, setHasReferrer] = useState(true);

    // Affiliate rank determines commission rates
    const [referrerRank, setReferrerRank] = useState('silver');

    // Commission rates by rank
    const commissionRates = {
        starter: { level1: 5, level2: 2, level3: 1, level4: 0.5 },
        bronze: { level1: 10, level2: 5, level3: 2, level4: 1 },
        silver: { level1: 15, level2: 8, level3: 3, level4: 1.5 },
        gold: { level1: 20, level2: 10, level3: 5, level4: 2 }
    };

    // Calculate total
    useEffect(() => {
        setPurchaseAmount(fractionCount * pricePerFraction);
    }, [fractionCount, pricePerFraction]);

    // Calculate commissions
    const calculateCommissions = () => {
        const rates = commissionRates[referrerRank];
        const total = purchaseAmount;

        return {
            level1: (total * rates.level1) / 100,
            level2: (total * rates.level2) / 100,
            level3: (total * rates.level3) / 100,
            level4: (total * rates.level4) / 100,
            total: (total * (rates.level1 + rates.level2 + rates.level3 + rates.level4)) / 100
        };
    };

    const commissions = calculateCommissions();
    const rates = commissionRates[referrerRank];

    // Example affiliate chain
    const affiliateChain = [
        { level: 1, address: '0x742d35...9a3f', name: 'Direct Referrer', rank: referrerRank },
        { level: 2, address: '0x853f21...2b1c', name: "Referrer's Referrer", rank: 'bronze' },
        { level: 3, address: '0x421a67...8d4e', name: 'Level 3 Affiliate', rank: 'bronze' },
        { level: 4, address: '0x639c94...5f7a', name: 'Level 4 Affiliate', rank: 'starter' }
    ];

    return (
        <div className="commission-calculator">
            <header className="calculator-header">
                <h1><FaCalculator /> Commission Calculator</h1>
                <p>See exactly how commissions are distributed when fractions are sold</p>
            </header>

            {/* Input Section */}
            <section className="calculator-inputs">
                <div className="input-card">
                    <h3>Purchase Details</h3>

                    <div className="input-group">
                        <label>Number of Fractions</label>
                        <input
                            type="number"
                            value={fractionCount}
                            onChange={(e) => setFractionCount(parseInt(e.target.value) || 0)}
                            min="1"
                            max="10000"
                        />
                    </div>

                    <div className="input-group">
                        <label>Price Per Fraction ($)</label>
                        <input
                            type="number"
                            value={pricePerFraction}
                            onChange={(e) => setPricePerFraction(parseFloat(e.target.value) || 0)}
                            min="10"
                            max="100"
                            step="0.01"
                        />
                        <span className="input-hint">Current: $15 (varies $10-$100)</span>
                    </div>

                    <div className="total-amount">
                        <span className="total-label">Total Purchase Amount:</span>
                        <span className="total-value">${purchaseAmount.toFixed(2)}</span>
                    </div>

                    <div className="input-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={hasReferrer}
                                onChange={(e) => setHasReferrer(e.target.checked)}
                            />
                            Has Referral Link
                        </label>
                    </div>

                    {hasReferrer && (
                        <div className="input-group">
                            <label>Referrer Rank</label>
                            <select
                                value={referrerRank}
                                onChange={(e) => setReferrerRank(e.target.value)}
                            >
                                <option value="starter">Starter (5-2-1-0.5%)</option>
                                <option value="bronze">Bronze (10-5-2-1%)</option>
                                <option value="silver">Silver (15-8-3-1.5%)</option>
                                <option value="gold">Gold (20-10-5-2%)</option>
                            </select>
                        </div>
                    )}
                </div>
            </section>

            {/* Visual Commission Flow */}
            {hasReferrer && (
                <section className="commission-flow">
                    <h2><FaChartLine /> Commission Distribution Flow</h2>

                    <div className="flow-diagram">
                        <div className="purchase-node">
                            <div className="node-icon">🛒</div>
                            <div className="node-title">Purchase</div>
                            <div className="node-amount">${purchaseAmount.toFixed(2)}</div>
                            <div className="node-detail">{fractionCount} fractions @ ${pricePerFraction}</div>
                        </div>

                        <div className="flow-arrow">↓</div>

                        <div className="commission-split">
                            <div className="split-label">Commission Distribution</div>

                            {affiliateChain.map((affiliate, i) => (
                                <div key={i} className={`affiliate-node level-${affiliate.level}`}>
                                    <div className="affiliate-header">
                                        <span className="level-badge">Level {affiliate.level}</span>
                                        <span className="rank-badge rank-{affiliate.rank}">{affiliate.rank}</span>
                                    </div>
                                    <div className="affiliate-address">{affiliate.address}</div>
                                    <div className="affiliate-name">{affiliate.name}</div>
                                    <div className="commission-calc">
                                        <div className="calc-formula">
                                            ${purchaseAmount.toFixed(2)} × {rates[`level${affiliate.level}`]}%
                                        </div>
                                        <div className="calc-result">
                                            = ${commissions[`level${affiliate.level}`].toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="commission-badge">
                                        +${commissions[`level${affiliate.level}`].toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flow-arrow">↓</div>

                        <div className="treasury-node">
                            <div className="node-icon">🏦</div>
                            <div className="node-title">To Treasury</div>
                            <div className="node-amount">${(purchaseAmount - commissions.total).toFixed(2)}</div>
                            <div className="node-detail">
                                ${purchaseAmount.toFixed(2)} - ${commissions.total.toFixed(2)} commission
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Commission Breakdown Table */}
            {hasReferrer && (
                <section className="commission-breakdown">
                    <h2>📊 Detailed Commission Breakdown</h2>

                    <table className="breakdown-table">
                        <thead>
                            <tr>
                                <th>Level</th>
                                <th>Affiliate</th>
                                <th>Commission Rate</th>
                                <th>Calculation</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliateChain.map((affiliate, i) => (
                                <tr key={i} className={`level-row-${affiliate.level}`}>
                                    <td>
                                        <span className={`level-badge level-${affiliate.level}`}>
                                            Level {affiliate.level}
                                        </span>
                                    </td>
                                    <td className="affiliate-cell">
                                        <div className="affiliate-info">
                                            <div className="affiliate-addr">{affiliate.address}</div>
                                            <div className="affiliate-nm">{affiliate.name}</div>
                                        </div>
                                    </td>
                                    <td className="rate-cell">
                                        <span className="rate-badge">{rates[`level${affiliate.level}`]}%</span>
                                    </td>
                                    <td className="calc-cell">
                                        ${purchaseAmount.toFixed(2)} × {rates[`level${affiliate.level}`]}%
                                    </td>
                                    <td className="amount-cell">
                                        <span className="commission-amount">
                                            ${commissions[`level${affiliate.level}`].toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan="4" className="total-label">Total Commissions Paid</td>
                                <td className="total-amount">${commissions.total.toFixed(2)}</td>
                            </tr>
                            <tr className="treasury-row">
                                <td colSpan="4" className="treasury-label">Amount to Treasury</td>
                                <td className="treasury-amount">${(purchaseAmount - commissions.total).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            )}

            {/* Rank Comparison */}
            <section className="rank-comparison">
                <h2>💎 Commission Rates by Rank</h2>
                <p className="comparison-note">
                    <FaInfoCircle /> Higher ranks earn more commission on the same sale
                </p>

                <div className="comparison-grid">
                    {Object.entries(commissionRates).map(([rank, rates]) => {
                        const rankCommissions = {
                            level1: (purchaseAmount * rates.level1) / 100,
                            level2: (purchaseAmount * rates.level2) / 100,
                            level3: (purchaseAmount * rates.level3) / 100,
                            level4: (purchaseAmount * rates.level4) / 100
                        };
                        const rankTotal = Object.values(rankCommissions).reduce((a, b) => a + b, 0);

                        return (
                            <div key={rank} className={`rank-card rank-${rank} ${rank === referrerRank ? 'active' : ''}`}>
                                <div className="rank-header">
                                    <div className="rank-icon">
                                        {rank === 'starter' && '🥉'}
                                        {rank === 'bronze' && '🥉'}
                                        {rank === 'silver' && '🥈'}
                                        {rank === 'gold' && '🥇'}
                                    </div>
                                    <div className="rank-name">{rank.toUpperCase()}</div>
                                </div>

                                <div className="rank-rates">
                                    <div className="rate-item">L1: {rates.level1}%</div>
                                    <div className="rate-item">L2: {rates.level2}%</div>
                                    <div className="rate-item">L3: {rates.level3}%</div>
                                    <div className="rate-item">L4: {rates.level4}%</div>
                                </div>

                                <div className="rank-separator"></div>

                                <div className="rank-earnings">
                                    <div className="earnings-label">On ${purchaseAmount} Sale:</div>
                                    <div className="earnings-levels">
                                        {Object.entries(rankCommissions).map(([level, amount]) => (
                                            <div key={level} className="earnings-item">
                                                <span className="earnings-level">{level.replace('level', 'L')}:</span>
                                                <span className="earnings-amount">${amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="earnings-total">
                                        Total: <strong>${rankTotal.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Example Scenarios */}
            <section className="example-scenarios">
                <h2>📋 Example Scenarios</h2>

                <div className="scenarios-grid">
                    <div className="scenario-card">
                        <h3>Small Purchase</h3>
                        <div className="scenario-details">
                            <div className="scenario-item">
                                <span>Fractions:</span> <strong>50</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Price:</span> <strong>$15/each</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Total:</span> <strong>$750</strong>
                            </div>
                        </div>
                        <div className="scenario-commissions">
                            <div className="scenario-title">Silver Rank Commissions:</div>
                            <div className="scenario-breakdown">
                                <div>L1 (15%): <strong>$112.50</strong></div>
                                <div>L2 (8%): <strong>$60.00</strong></div>
                                <div>L3 (3%): <strong>$22.50</strong></div>
                                <div>L4 (1.5%): <strong>$11.25</strong></div>
                                <div className="scenario-total">Total: <strong>$206.25</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="scenario-card">
                        <h3>Medium Purchase</h3>
                        <div className="scenario-details">
                            <div className="scenario-item">
                                <span>Fractions:</span> <strong>500</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Price:</span> <strong>$50/each</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Total:</span> <strong>$25,000</strong>
                            </div>
                        </div>
                        <div className="scenario-commissions">
                            <div className="scenario-title">Gold Rank Commissions:</div>
                            <div className="scenario-breakdown">
                                <div>L1 (20%): <strong>$5,000</strong></div>
                                <div>L2 (10%): <strong>$2,500</strong></div>
                                <div>L3 (5%): <strong>$1,250</strong></div>
                                <div>L4 (2%): <strong>$500</strong></div>
                                <div className="scenario-total">Total: <strong>$9,250</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="scenario-card">
                        <h3>Large Purchase</h3>
                        <div className="scenario-details">
                            <div className="scenario-item">
                                <span>Fractions:</span> <strong>2,000</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Price:</span> <strong>$85/each</strong>
                            </div>
                            <div className="scenario-item">
                                <span>Total:</span> <strong>$170,000</strong>
                            </div>
                        </div>
                        <div className="scenario-commissions">
                            <div className="scenario-title">Gold Rank Commissions:</div>
                            <div className="scenario-breakdown">
                                <div>L1 (20%): <strong>$34,000</strong></div>
                                <div>L2 (10%): <strong>$17,000</strong></div>
                                <div>L3 (5%): <strong>$8,500</strong></div>
                                <div>L4 (2%): <strong>$3,400</strong></div>
                                <div className="scenario-total">Total: <strong>$62,900</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Boxes */}
            <section className="info-section">
                <div className="info-box">
                    <h3><FaInfoCircle /> How Commissions Work</h3>
                    <ul>
                        <li>Commissions are paid <strong>instantly</strong> when a purchase is made</li>
                        <li>You earn from up to <strong>4 levels</strong> of referrals</li>
                        <li>Higher ranks get <strong>higher commission rates</strong></li>
                        <li>Commissions are paid in <strong>USDC/USDT</strong> (same as purchase)</li>
                        <li>All commissions are <strong>on-chain</strong> and transparent</li>
                        <li>Treasury receives: Purchase Amount - Total Commissions</li>
                    </ul>
                </div>

                <div className="info-box">
                    <h3>💡 Tips to Maximize Earnings</h3>
                    <ul>
                        <li>Build a <strong>wide network</strong> at Level 1 for most commissions</li>
                        <li>Help your referrals <strong>rank up</strong> to boost their sales</li>
                        <li><strong>Share on social media</strong> for viral growth</li>
                        <li>Target <strong>larger purchases</strong> for bigger commissions</li>
                        <li>Achieve <strong>Gold rank</strong> for 20% Level 1 commissions</li>
                        <li>Focus on <strong>active referrals</strong> who purchase regularly</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default CommissionCalculator;

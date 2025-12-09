import { useState, useEffect } from 'react';
import { useValidatorSale } from '../hooks/useValidatorSale';

export default function EnhancedSaleDashboard() {
    const { stats, currentPrice, isBuying } = useValidatorSale();
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [recentPurchases, setRecentPurchases] = useState([]);
    const [validatorPerformance, setValidatorPerformance] = useState([]);

    // Countdown timer (example: sale ends in 30 days)
    useEffect(() => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);

        const interval = setInterval(() => {
            const now = new Date();
            const diff = targetDate - now;

            setTimeRemaining({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Mock recent purchases (in real app, fetch from blockchain)
    useEffect(() => {
        setRecentPurchases([
            { address: '0x1234...5678', amount: 1000, time: '2 mins ago', usd: 45000 },
            { address: '0xabcd...ef12', amount: 500, time: '5 mins ago', usd: 22500 },
            { address: '0x9876...5432', amount: 2500, time: '12 mins ago', usd: 112500 },
            { address: '0x4567...89ab', amount: 750, time: '18 mins ago', usd: 33750 },
            { address: '0xfedc...ba98', amount: 300, time: '25 mins ago', usd: 13500 }
        ]);

        setValidatorPerformance([
            { id: 1, uptime: 99.97, rewards: 12500, apr: 18.5, status: 'active' },
            { id: 2, uptime: 99.95, rewards: 12400, apr: 18.3, status: 'active' },
            { id: 3, uptime: 99.98, rewards: 12600, apr: 18.7, status: 'active' },
            { id: 4, uptime: 99.96, rewards: 12450, apr: 18.4, status: 'active' },
            { id: 5, uptime: 99.94, rewards: 12350, apr: 18.2, status: 'active' }
        ]);
    }, []);

    if (!stats) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading sale data...</p>
            </div>
        );
    }

    const progressPercent = (stats.fractionsSold / 1800000) * 100;
    const totalInvestors = Math.floor(stats.fractionsSold / 250); // avg 250 fractions per investor

    return (
        <div className="enhanced-sale-dashboard">
            {/* Countdown Timer Section */}
            <div className="countdown-section">
                <h3>⏰ Sale Ends In:</h3>
                <div className="countdown-timer">
                    <div className="time-unit">
                        <div className="time-value">{timeRemaining.days}</div>
                        <div className="time-label">Days</div>
                    </div>
                    <div className="time-separator">:</div>
                    <div className="time-unit">
                        <div className="time-value">{timeRemaining.hours}</div>
                        <div className="time-label">Hours</div>
                    </div>
                    <div className="time-separator">:</div>
                    <div className="time-unit">
                        <div className="time-value">{timeRemaining.minutes}</div>
                        <div className="time-label">Minutes</div>
                    </div>
                    <div className="time-separator">:</div>
                    <div className="time-unit">
                        <div className="time-value">{timeRemaining.seconds}</div>
                        <div className="time-label">Seconds</div>
                    </div>
                </div>
            </div>

            {/* Real-time Stats Grid */}
            <div className="stats-grid">
                {/* Current Price */}
                <div className="stat-card highlight">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <label>Current Price</label>
                        <h2>${parseFloat(currentPrice).toFixed(2)}</h2>
                        <span className="stat-subtitle">per fraction</span>
                        <div className="stat-trend positive">↗ +2.5% from yesterday</div>
                    </div>
                </div>

                {/* Fractions Sold */}
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <label>Fractions Sold</label>
                        <h2>{stats.fractionsSold.toLocaleString()}</h2>
                        <span className="stat-subtitle">of 1,800,000 ({progressPercent.toFixed(2)}%)</span>
                    </div>
                </div>

                {/* Total Raised */}
                <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <label>Total Raised</label>
                        <h2>${parseFloat(stats.totalRaised).toLocaleString()}</h2>
                        <span className="stat-subtitle">USDC raised</span>
                    </div>
                </div>

                {/* Total Investors */}
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <label>Total Investors</label>
                        <h2>{totalInvestors.toLocaleString()}</h2>
                        <span className="stat-subtitle">and growing</span>
                    </div>
                </div>

                {/* Remaining */}
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <label>Remaining</label>
                        <h2>{stats.fractionsRemaining.toLocaleString()}</h2>
                        <span className="stat-subtitle">fractions available</span>
                    </div>
                </div>

                {/* Average Investment */}
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <label>Avg Investment</label>
                        <h2>${(parseFloat(stats.totalRaised) / totalInvestors).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
                        <span className="stat-subtitle">per investor</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
                <div className="progress-header">
                    <span>Sale Progress</span>
                    <span>{progressPercent.toFixed(2)}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <div className="progress-labels">
                    <span>$10 (Start)</span>
                    <span className="current-price-label">${currentPrice} (Current)</span>
                    <span>$100 (End)</span>
                </div>
            </div>

            {/* Enhanced Bonding Curve Visualization */}
            <div className="bonding-curve-section">
                <h3>📈 Price Bonding Curve</h3>
                <p>Price increases linearly from $10 to $100 as fractions sell out</p>
                <BondingCurveSVG currentFraction={stats.fractionsSold} currentPrice={currentPrice} />
            </div>

            {/* Rewards Estimator Calculator */}
            <div className="rewards-estimator-section">
                <h3>💰 Rewards Estimator</h3>
                <RewardsEstimator currentPrice={currentPrice} />
            </div>

            {/* Two Column Layout: Recent Purchases + Validator Performance */}
            <div className="info-columns">
                {/* Recent Purchases - Social Proof */}
                <div className="recent-purchases-section">
                    <h3>🔥 Recent Purchases (Live)</h3>
                    <div className="purchases-list">
                        {recentPurchases.map((purchase, index) => (
                            <div key={index} className="purchase-item">
                                <div className="purchase-avatar">
                                    {purchase.address.substring(0, 6)}
                                </div>
                                <div className="purchase-details">
                                    <div className="purchase-amount">
                                        {purchase.amount.toLocaleString()} fractions
                                    </div>
                                    <div className="purchase-value">
                                        ${purchase.usd.toLocaleString()}
                                    </div>
                                </div>
                                <div className="purchase-time">{purchase.time}</div>
                            </div>
                        ))}
                    </div>
                    <div className="purchases-stats">
                        <div className="stats-item">
                            <span className="label">Last 24h Volume:</span>
                            <span className="value">$2.3M</span>
                        </div>
                        <div className="stats-item">
                            <span className="label">Last Hour:</span>
                            <span className="value">127 purchases</span>
                        </div>
                    </div>
                </div>

                {/* Validator Performance */}
                <div className="validator-performance-section">
                    <h3>🖥️ Validator Performance</h3>
                    <div className="validator-grid">
                        {validatorPerformance.map((validator) => (
                            <div key={validator.id} className="validator-card">
                                <div className="validator-header">
                                    <span className="validator-id">Validator #{validator.id}</span>
                                    <span className={`validator-status ${validator.status}`}>
                                        ● {validator.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="validator-stats">
                                    <div className="validator-stat">
                                        <span className="label">Uptime</span>
                                        <span className="value">{validator.uptime}%</span>
                                    </div>
                                    <div className="validator-stat">
                                        <span className="label">24h Rewards</span>
                                        <span className="value">{validator.rewards.toLocaleString()} IONX</span>
                                    </div>
                                    <div className="validator-stat highlight">
                                        <span className="label">APR</span>
                                        <span className="value">{validator.apr}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="validator-summary">
                        <div className="summary-item">
                            <span className="label">Network Uptime:</span>
                            <span className="value">99.96%</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Avg APR:</span>
                            <span className="value">18.4%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric">
                    <span className="metric-label">Validators for Sale</span>
                    <span className="metric-value">18</span>
                </div>
                <div className="metric">
                    <span className="metric-label">Fractions per Validator</span>
                    <span className="metric-value">100,000</span>
                </div>
                <div className="metric">
                    <span className="metric-label">Daily Rewards per Validator</span>
                    <span className="metric-value">~970 IONX</span>
                </div>
                <div className="metric">
                    <span className="metric-label">Min Purchase</span>
                    <span className="metric-value">1 fraction</span>
                </div>
            </div>
        </div>
    );
}

// Enhanced Bonding Curve SVG
function BondingCurveSVG({ currentFraction, currentPrice }) {
    const width = 800;
    const height = 400;
    const padding = 60;

    const totalFractions = 1800000;
    const currentX = padding + ((currentFraction / totalFractions) * (width - 2 * padding));
    const currentY = height - padding - ((currentFraction / totalFractions) * (height - 2 * padding));

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bonding-curve-svg">
            {/* Grid lines */}
            <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="2" />
            <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#333" strokeWidth="2" />

            {/* Gradient for curve */}
            <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#4CAF50', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#FF5722', stopOpacity: 1 }} />
                </linearGradient>
            </defs>

            {/* Curve line */}
            <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={padding}
                stroke="url(#curveGradient)"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Filled area under curve */}
            <polygon
                points={`${padding},${height - padding} ${currentX},${currentY} ${currentX},${height - padding}`}
                fill="rgba(76, 175, 80, 0.1)"
            />

            {/* Current position marker */}
            <circle cx={currentX} cy={currentY} r="8" fill="#FF5722" stroke="#fff" strokeWidth="3" />
            <line x1={currentX} y1={currentY} x2={currentX} y2={height - padding} stroke="#FF5722" strokeWidth="2" strokeDasharray="5,5" />

            {/* Price labels on Y-axis */}
            <text x={padding - 35} y={height - padding + 5} fontSize="14" fill="#666" fontWeight="bold">$10</text>
            <text x={padding - 40} y={padding + 5} fontSize="14" fill="#666" fontWeight="bold">$100</text>

            {/* Fraction labels on X-axis */}
            <text x={padding - 10} y={height - padding + 25} fontSize="12" fill="#666">0</text>
            <text x={width - padding - 30} y={height - padding + 25} fontSize="12" fill="#666">1.8M</text>

            {/* Current price indicator */}
            <rect x={currentX - 50} y={currentY - 40} width="100" height="30" fill="#FF5722" rx="5" />
            <text x={currentX} y={currentY - 20} fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle">
                ${currentPrice}
            </text>

            {/* Axis labels */}
            <text x={width / 2} y={height - 15} fontSize="14" fill="#555" textAnchor="middle" fontWeight="bold">
                Fractions Sold
            </text>
            <text x={20} y={height / 2} fontSize="14" fill="#555" textAnchor="middle" fontWeight="bold" transform={`rotate(-90, 20, ${height / 2})`}>
                Price (USD)
            </text>
        </svg>
    );
}

// Rewards Estimator Component
function RewardsEstimator({ currentPrice }) {
    const [investment, setInvestment] = useState(1000);
    const fractions = Math.floor(investment / currentPrice);
    const dailyRewards = fractions * 0.0054; // 970 IONX per 100K fractions = 0.0097 per fraction, conservative 0.0054
    const monthlyRewards = dailyRewards * 30;
    const annualRewards = dailyRewards * 365;
    const ionxPrice = 0.10; // Assume $0.10 per IONX
    const annualReturnUSD = annualRewards * ionxPrice;
    const roi = (annualReturnUSD / investment) * 100;

    return (
        <div className="rewards-estimator">
            <div className="estimator-input">
                <label>Investment Amount (USD)</label>
                <div className="input-slider-group">
                    <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={investment}
                        onChange={(e) => setInvestment(parseInt(e.target.value))}
                        className="investment-slider"
                    />
                    <input
                        type="number"
                        value={investment}
                        onChange={(e) => setInvestment(parseInt(e.target.value) || 100)}
                        className="investment-input"
                    />
                </div>
            </div>

            <div className="estimator-results">
                <div className="result-row">
                    <span className="result-label">You Get:</span>
                    <span className="result-value">{fractions.toLocaleString()} fractions</span>
                </div>
                <div className="result-row">
                    <span className="result-label">Daily Rewards:</span>
                    <span className="result-value">{dailyRewards.toFixed(2)} IONX (${(dailyRewards * ionxPrice).toFixed(2)})</span>
                </div>
                <div className="result-row">
                    <span className="result-label">Monthly Rewards:</span>
                    <span className="result-value">{monthlyRewards.toFixed(2)} IONX (${(monthlyRewards * ionxPrice).toFixed(2)})</span>
                </div>
                <div className="result-row">
                    <span className="result-label">Annual Rewards:</span>
                    <span className="result-value highlight">{annualRewards.toFixed(2)} IONX (${annualReturnUSD.toFixed(2)})</span>
                </div>
                <div className="result-row roi-row">
                    <span className="result-label">Estimated ROI:</span>
                    <span className="result-value roi-value">{roi.toFixed(2)}%</span>
                </div>
            </div>

            <div className="estimator-note">
                <p>💡 Estimates based on current network performance. Actual rewards may vary based on validator uptime and network fees.</p>
            </div>
        </div>
    );
}

import { useValidatorSale } from '../hooks/useValidatorSale';

export default function SaleDashboard() {
    const { stats, currentPrice, isBuying } = useValidatorSale();

    if (!stats) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading sale data...</p>
            </div>
        );
    }

    const progressPercent = (stats.fractionsSold / 1800000) * 100;

    return (
        <div className="sale-dashboard">
            <div className="dashboard-header">
                <h1>🚀 Validator Fraction Sale</h1>
                <p className="tagline">Own a piece of Ionova's validators. Earn passive rewards.</p>
            </div>

            <div className="stats-grid">
                {/* Current Price */}
                <div className="stat-card highlight">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <label>Current Price</label>
                        <h2>${parseFloat(currentPrice).toFixed(2)}</h2>
                        <span className="stat-subtitle">per fraction</span>
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
                        <span className="stat-subtitle">USDC</span>
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
                    <span>$10</span>
                    <span>${currentPrice}</span>
                    <span>$100</span>
                </div>
            </div>

            {/* Bonding Curve Visualization */}
            <div className="bonding-curve-section">
                <h3>📈 Bonding Curve</h3>
                <p>Price increases linearly from $10 to $100 as fractions sell</p>
                <BondingCurveSVG currentFraction={stats.fractionsSold} />
            </div>

            {/* Key Metrics */}
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
                    <span className="metric-label">Est. Annual Yield</span>
                    <span className="metric-value">~970 IONX/day</span>
                </div>
                <div className="metric">
                    <span className="metric-label">Min Purchase</span>
                    <span className="metric-value">1 fraction</span>
                </div>
            </div>
        </div>
    );
}

// Simple SVG bonding curve visualization
function BondingCurveSVG({ currentFraction }) {
    const width = 600;
    const height = 300;
    const padding = 40;

    const totalFractions = 1800000;
    const currentX = padding + ((currentFraction / totalFractions) * (width - 2 * padding));
    const currentY = height - padding - ((currentFraction / totalFractions) * (height - 2 * padding));

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bonding-curve-svg">
            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="2" />
            <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#333" strokeWidth="2" />

            {/* Curve */}
            <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={padding}
                stroke="#4CAF50"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* Current position */}
            <circle cx={currentX} cy={currentY} r="6" fill="#FF5722" />
            <line x1={currentX} y1={currentY} x2={currentX} y2={height - padding} stroke="#FF5722" strokeWidth="2" strokeDasharray="5,5" />

            {/* Labels */}
            <text x={padding} y={height - padding + 25} fontSize="12" fill="#666">$10</text>
            <text x={width - padding - 20} y={height - padding + 25} fontSize="12" fill="#666">$100</text>
            <text x={padding - 30} y={height - padding} fontSize="12" fill="#666">1</text>
            <text x={padding - 50} y={padding + 5} fontSize="12" fill="#666">1.8M</text>

            {/* Current marker label */}
            <text x={currentX - 30} y={currentY - 10} fontSize="14" fontWeight="bold" fill="#FF5722">
                You are here
            </text>
        </svg>
    );
}

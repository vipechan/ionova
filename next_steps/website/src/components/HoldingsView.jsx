import { useValidatorSale } from '../hooks/useValidatorSale';
import { formatUnits } from 'viem';

export default function HoldingsView() {
    const {
        userFractions,
        ownershipPercentage,
        pendingRewards,
        claimRewards,
        isClaiming,
        claimSuccess,
    } = useValidatorSale();

    const hasHoldings = userFractions > 0;

    const dailyRewards = userFractions * 970; // 970 IONX per fraction per day
    const annualRewards = dailyRewards * 365;

    if (!hasHoldings) {
        return (
            <div className="holdings-view empty">
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h2>No Fractions Owned</h2>
                    <p>Purchase validator fractions to start earning rewards</p>
                    <a href="#purchase" className="btn btn-primary">
                        Buy Fractions
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="holdings-view">
            <h2>💼 Your Holdings</h2>

            <div className="holdings-grid">
                {/* Fractions Owned */}
                <div className="holding-card primary">
                    <div className="card-icon">🎫</div>
                    <div className="card-content">
                        <label>Fractions Owned</label>
                        <h3>{userFractions.toLocaleString()}</h3>
                        <span className="card-subtitle">
                            {ownershipPercentage.toFixed(4)}% of total supply
                        </span>
                    </div>
                </div>

                {/* Pending Rewards */}
                <div className="holding-card">
                    <div className="card-icon">🎁</div>
                    <div className="card-content">
                        <label>Pending Rewards</label>
                        <h3>{parseFloat(pendingRewards).toLocaleString()} IONX</h3>
                        <span className="card-subtitle">
                            ~${parseFloat(pendingRewards).toLocaleString()} USD
                        </span>
                    </div>
                </div>

                {/* Daily Rewards */}
                <div className="holding-card">
                    <div className="card-icon">📅</div>
                    <div className="card-content">
                        <label>Daily Rewards</label>
                        <h3>{dailyRewards.toLocaleString()} IONX</h3>
                        <span className="card-subtitle">
                            ~${dailyRewards.toLocaleString()} USD/day
                        </span>
                    </div>
                </div>

                {/* Annual Rewards */}
                <div className="holding-card">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                        <label>Annual Rewards</label>
                        <h3>{annualRewards.toLocaleString()} IONX</h3>
                        <span className="card-subtitle">
                            ~${annualRewards.toLocaleString()} USD/year
                        </span>
                    </div>
                </div>
            </div>

            {/* Claim Rewards */}
            <div className="claim-section">
                <div className="claim-header">
                    <div>
                        <h3>Claim Your Rewards</h3>
                        <p>Claim your accumulated IONX rewards</p>
                    </div>
                    <button
                        onClick={() => claimRewards()}
                        disabled={isClaiming || parseFloat(pendingRewards) === 0}
                        className="btn btn-primary btn-large"
                    >
                        {isClaiming ? (
                            <>
                                <span className="spinner-small"></span>
                                Claiming...
                            </>
                        ) : (
                            <>🎁 Claim {parseFloat(pendingRewards).toLocaleString()} IONX</>
                        )}
                    </button>
                </div>

                {claimSuccess && (
                    <div className="claim-success">
                        ✅ Successfully claimed rewards! IONX tokens sent to your wallet.
                    </div>
                )}
            </div>

            {/* Validator Distribution */}
            <div className="validator-distribution">
                <h3>📊 Validator Distribution</h3>
                <p>Your fractions are distributed across {Math.ceil(userFractions / 100000)} validators</p>

                <div className="distribution-grid">
                    {getValidatorDistribution(userFractions).map((validator, idx) => (
                        <div key={idx} className="validator-item">
                            <div className="validator-number">Validator #{validator.id}</div>
                            <div className="validator-fractions">{validator.fractions} fractions</div>
                            <div className="validator-percentage">
                                {((validator.fractions / 100000) * 100).toFixed(2)}% ownership
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* NFT Info */}
            <div className="nft-info">
                <h3>🖼️ Your Fraction NFTs</h3>
                <p>Your fractions are ERC-1155 NFTs. You can view them in:</p>
                <div className="nft-links">
                    <a href="https://opensea.io" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        View on OpenSea
                    </a>
                    <a href="#" className="btn btn-secondary">
                        View in Wallet
                    </a>
                </div>
                <p className="nft-note">
                    💡 You can trade your fraction NFTs on any NFT marketplace
                </p>
            </div>

            {/* Performance Stats */}
            <div className="performance-stats">
                <h3>📊 Performance Metrics</h3>
                <div className="stat-row">
                    <span>Total Ownership:</span>
                    <span className="value">{ownershipPercentage.toFixed(4)}%</span>
                </div>
                <div className="stat-row">
                    <span>Rewards Claimed (All Time):</span>
                    <span className="value">0 IONX</span>
                </div>
                <div className="stat-row">
                    <span>Next Reward:</span>
                    <span className="value">{dailyRewards.toLocaleString()} IONX (tomorrow)</span>
                </div>
            </div>
        </div>
    );
}

// Helper function to get validator distribution
function getValidatorDistribution(totalFractions) {
    const distribution = [];
    let remaining = totalFractions;
    let validatorId = 0;

    while (remaining > 0) {
        const fractionsInValidator = Math.min(remaining, 100000);
        distribution.push({
            id: validatorId,
            fractions: fractionsInValidator,
        });
        remaining -= fractionsInValidator;
        validatorId++;
    }

    return distribution;
}

import { useState } from 'react';
import { useValidatorSale } from '../hooks/useValidatorSale';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useSearchParams } from 'react-router-dom';

const TOKEN_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

export default function PurchaseForm() {
    const [searchParams] = useSearchParams();
    const referrer = searchParams.get('ref') || '0x0000000000000000000000000000000000000000';

    const [quantity, setQuantity] = useState(1);
    const [cost, setCost] = useState(null);
    const [selectedToken, setSelectedToken] = useState('USDC');
    const { address: userAddress } = useAccount();

    const {
        contractAddress,
        currentPrice,
        kycVerified,
        buyFractions,
        isBuying,
        buySuccess,
        getTotalCost,
        calculateROI,
    } = useValidatorSale();

    const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
    const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS;

    const currentTokenAddress = selectedToken === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;

    // Read token allowance
    const { data: allowance } = useReadContract({
        address: currentTokenAddress,
        abi: TOKEN_ABI,
        functionName: 'allowance',
        args: [userAddress, contractAddress],
        query: {
            enabled: !!userAddress,
        },
    });

    // Approve token
    const { writeContract: approveTokenWrite, isPending: isApproving } = useWriteContract();

    // Calculate cost when quantity changes
    const handleQuantityChange = async (newQuantity) => {
        setQuantity(newQuantity);
        if (newQuantity > 0) {
            const totalCost = await getTotalCost(newQuantity);
            setCost(totalCost);
        }
    };

    // Handle approve
    const handleApprove = async () => {
        if (!cost) return;
        approveTokenWrite({
            address: currentTokenAddress,
            abi: TOKEN_ABI,
            functionName: 'approve',
            args: [contractAddress, cost],
        });
    };

    // Handle purchase
    const handlePurchase = async () => {
        if (!quantity || quantity < 1) {
            alert('Please enter a valid quantity');
            return;
        }

        buyFractions({
            args: [BigInt(quantity), referrer, currentTokenAddress],
        });
    };

    // Check if need approval
    const needsApproval = cost && allowance !== undefined && allowance < cost;

    // Calculate metrics based on CORRECT_VESTING_EMISSION.md
    // Total rewards per fraction over 15 years: 752.4 IONX
    // Emission follows annual halving starting at 50% in Year 1
    const totalCostUSD = cost ? parseFloat(formatUnits(cost, 6)) : 0;
    const roi = cost ? calculateROI(quantity, cost) : 0;

    // Per fraction rewards
    const lifetimeRewardsPerFraction = 3750; // Total IONX over 15 years
    const year1RewardsPerFraction = lifetimeRewardsPerFraction * 0.5; // 50% in Year 1 = 1875 IONX
    const year2RewardsPerFraction = lifetimeRewardsPerFraction * 0.25; // 25% in Year 2 = 937.5 IONX

    // Total rewards for quantity purchased
    const lifetimeRewards = quantity * lifetimeRewardsPerFraction;
    const year1Rewards = quantity * year1RewardsPerFraction;
    const year2Rewards = quantity * year2RewardsPerFraction;

    // Daily breakdown (Year 1)
    const dailyYear1 = year1Rewards / 365; // Daily rewards in Year 1

    // Only require KYC for purchases over 100 fractions
    if (!kycVerified && quantity > 100) {
        return (
            <div className="purchase-form kyc-required">
                <div className="kyc-warning">
                    <h3>⚠️ KYC Verification Required</h3>
                    <p>KYC verification is required for bulk purchases over 100 fractions.</p>
                    <p className="kyc-exemption">💡 <strong>Tip:</strong> Purchases of 100 fractions or less don't require KYC!</p>
                    <button className="btn btn-primary">Start KYC Verification</button>
                </div>
            </div>
        );
    }

    if (buySuccess) {
        return (
            <div className="purchase-form success">
                <div className="success-message">
                    <div className="success-icon">✅</div>
                    <h2>Purchase Successful!</h2>
                    <p>You successfully purchased <strong>{quantity} fractions</strong> with {selectedToken}</p>
                    <div className="success-details">
                        <div>Total Cost: ${totalCostUSD.toLocaleString()} {selectedToken}</div>
                        <div>Year 1 Rewards: {year1Rewards.toLocaleString()} IONX</div>
                        <div>Lifetime Rewards (15 years): {lifetimeRewards.toLocaleString()} IONX</div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                        Buy More Fractions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="purchase-form">
            <h2>🛒 Purchase Fractions</h2>

            {referrer && referrer !== '0x0000000000000000000000000000000000000000' && (
                <div className="referral-notice">
                    ℹ️ You're using a referral link! Your referrer will earn commission.
                </div>
            )}

            {/* Token Selection */}
            <div className="form-group">
                <label>Payment Token</label>
                <div className="token-selector">
                    <button
                        className={`token-btn ${selectedToken === 'USDC' ? 'active' : ''}`}
                        onClick={() => setSelectedToken('USDC')}
                    >
                        💵 USDC
                    </button>
                    <button
                        className={`token-btn ${selectedToken === 'USDT' ? 'active' : ''}`}
                        onClick={() => setSelectedToken('USDT')}
                    >
                        💵 USDT
                    </button>
                </div>
                <p className="token-note">Select which stablecoin to use for payment</p>
            </div>

            {/* Quantity Input */}
            <div className="form-group">
                <label htmlFor="quantity">Number of Fractions</label>
                <div className="input-with-buttons">
                    <button onClick={() => handleQuantityChange(Math.max(1, quantity - 1))} className="btn btn-small">-</button>
                    <input type="number" id="quantity" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)} min="1" className="quantity-input" />
                    <button onClick={() => handleQuantityChange(quantity + 1)} className="btn btn-small">+</button>
                </div>
                <div className="quick-select">
                    <button onClick={() => handleQuantityChange(10)}>10</button>
                    <button onClick={() => handleQuantityChange(100)}>100</button>
                    <button onClick={() => handleQuantityChange(1000)}>1,000</button>
                    <button onClick={() => handleQuantityChange(10000)}>10,000</button>
                </div>
                <div className="roi-display">
                    <h3>💰 Estimated Returns</h3>

                    <div className="reward-breakdown">
                        <div className="reward-item">
                            <span className="label">Daily (Year 1):</span>
                            <span className="value">{dailyYear1.toFixed(2)} IONX</span>
                        </div>
                        <div className="reward-item">
                            <span className="label">Year 1 Total:</span>
                            <span className="value">{year1Rewards.toFixed(0)} IONX</span>
                        </div>
                        <div className="reward-item">
                            <span className="label">Year 2 Total:</span>
                            <span className="value">{year2Rewards.toFixed(0)} IONX</span>
                        </div>
                        <div className="reward-item">
                            <span className="label">Lifetime (15 years):</span>
                            <span className="value">{lifetimeRewards.toFixed(0)} IONX</span>
                        </div>
                    </div>

                    <div className="vesting-info">
                        <h4>🔄 Emission Schedule</h4>
                        <div className="distribution-split">
                            <div className="split-item">
                                <div className="split-icon">📈</div>
                                <div className="split-details">
                                    <div className="split-label">Annual Halving Model</div>
                                    <div className="split-note">Rewards decrease by ~50% each year following emission curve</div>
                                </div>
                            </div>
                        </div>

                        <div className="vesting-schedule">
                            <p className="info-text">
                                <strong>How It Works:</strong><br />
                                Validator rewards follow Ionova's emission schedule with annual halving:
                            </p>
                            <ul className="vesting-years">
                                <li>Year 1: {year1RewardsPerFraction.toFixed(1)} IONX/fraction (50% of total)</li>
                                <li>Year 2: {year2RewardsPerFraction.toFixed(1)} IONX/fraction (25% of total)</li>
                                <li>Year 3: {(lifetimeRewardsPerFraction * 0.125).toFixed(1)} IONX/fraction (12.5%)</li>
                                <li>Year 4-15: Continues halving to completion ✅</li>
                            </ul>
                            <p className="info-text">
                                Total: {lifetimeRewardsPerFraction} IONX per fraction over 15 years
                            </p>
                        </div>
                    </div>

                    <div className="roi-stats">
                        <div className="stat">
                            <span className="stat-label">Year 1 ROI:</span>
                            <span className="stat-value">{roi.toFixed(0)}%</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Emission Model:</span>
                            <span className="stat-value">Annual Halving</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="cost-breakdown">
                <div className="breakdown-row">
                    <span>Price per Fraction:</span>
                    <span className="value">${parseFloat(currentPrice).toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                    <span>Quantity:</span>
                    <span className="value">{quantity.toLocaleString()}</span>
                </div>
                <div className="breakdown-row total">
                    <span>Total Cost:</span>
                    <span className="value">${totalCostUSD.toLocaleString()} {selectedToken}</span>
                </div>
            </div>

            {/* Purchase Buttons */}
            <div className="purchase-actions">
                {needsApproval ? (
                    <button onClick={handleApprove} disabled={isApproving} className="btn btn-primary btn-large">
                        {isApproving ? <>Approving {selectedToken}...</> : <>🔓 Approve {selectedToken}</>}
                    </button>
                ) : (
                    <button onClick={handlePurchase} disabled={isBuying || !cost} className="btn btn-primary btn-large">
                        {isBuying ? <>Purchasing...</> : <>💳 Buy {quantity} Fractions for ${totalCostUSD.toLocaleString()} {selectedToken}</>}
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="purchase-info">
                <p>✓ Fractions are minted as ERC-1155 NFTs</p>
                <p>✓ Pay with USDC or USDT</p>
                <p>✓ Earn proportional validator rewards</p>
            </div>
        </div>
    );
}

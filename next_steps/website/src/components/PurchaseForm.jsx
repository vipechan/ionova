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

    // Calculate metrics
    const totalCostUSD = cost ? parseFloat(formatUnits(cost, 6)) : 0;
    const roi = cost ? calculateROI(quantity, cost) : 0;
    const dailyRewards = quantity * 970;
    const annualRewards = dailyRewards * 365;

    if (!kycVerified) {
        return (
            <div className="purchase-form kyc-required">
                <div className="kyc-warning">
                    <h3>⚠️ KYC Verification Required</h3>
                    <p>You must complete KYC verification before purchasing fractions.</p>
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
                        <div>Estimated Annual Rewards: {annualRewards.toLocaleString()} IONX</div>
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

            {/* ROI Calculator */}
            <div className="roi-section">
                <h3>📊 Return on Investment</h3>
                <div className="roi-grid">
                    <div className="roi-item">
                        <label>Daily Rewards</label>
                        <value>{dailyRewards.toLocaleString()} IONX</value>
                    </div>
                    <div className="roi-item">
                        <label>Annual Rewards</label>
                        <value>{annualRewards.toLocaleString()} IONX</value>
                    </div>
                    <div className="roi-item highlight">
                        <label>Estimated ROI</label>
                        <value>{roi.toFixed(0)}%</value>
                    </div>
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

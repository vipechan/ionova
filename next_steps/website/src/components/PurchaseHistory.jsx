import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function PurchaseHistory() {
    const { address } = useAccount();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock purchase history (in real app, fetch from blockchain)
        if (address) {
            setTimeout(() => {
                setPurchases([
                    {
                        id: 1,
                        date: '2024-12-01',
                        fractions: 1000,
                        price: 42.50,
                        total: 42500,
                        token: 'USDC',
                        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                        block: 12345678
                    },
                    {
                        id: 2,
                        date: '2024-11-28',
                        fractions: 500,
                        price: 38.20,
                        total: 19100,
                        token: 'USDT',
                        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                        block: 12344567
                    },
                    {
                        id: 3,
                        date: '2024-11-25',
                        fractions: 2500,
                        price: 35.80,
                        total: 89500,
                        token: 'USDC',
                        txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
                        block: 12343456
                    },
                    {
                        id: 4,
                        date: '2024-11-20',
                        fractions: 750,
                        price: 31.50,
                        total: 23625,
                        token: 'USDC',
                        txHash: '0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                        block: 12342345
                    }
                ]);
                setLoading(false);
            }, 1000);
        } else {
            setLoading(false);
        }
    }, [address]);

    if (!address) {
        return (
            <div className="purchase-history">
                <div className="empty-state">
                    <h3>📊 Purchase History</h3>
                    <p>Connect your wallet to view your purchase history</p>
                    <button className="btn btn-primary">Connect Wallet</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="purchase-history">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your purchase history...</p>
                </div>
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <div className="purchase-history">
                <div className="empty-state">
                    <h3>📊 Purchase History</h3>
                    <p>You haven't made any purchases yet</p>
                    <p className="hint">Start by purchasing your first validator fractions!</p>
                </div>
            </div>
        );
    }

    const totalFractions = purchases.reduce((sum, p) => sum + p.fractions, 0);
    const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);
    const avgPrice = totalSpent / totalFractions;

    return (
        <div className="purchase-history">
            <h2>📊 Your Purchase History</h2>

            {/* Summary Cards */}
            <div className="history-summary">
                <div className="summary-card">
                    <div className="summary-label">Total Purchases</div>
                    <div className="summary-value">{purchases.length}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Total Fractions</div>
                    <div className="summary-value">{totalFractions.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Total Spent</div>
                    <div className="summary-value">${totalSpent.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Avg Price</div>
                    <div className="summary-value">${avgPrice.toFixed(2)}</div>
                </div>
            </div>

            {/* Purchase Table */}
            <div className="purchases-table-container">
                <table className="purchases-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Fractions</th>
                            <th>Price/Fraction</th>
                            <th>Total</th>
                            <th>Token</th>
                            <th>Transaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((purchase) => (
                            <tr key={purchase.id}>
                                <td>{new Date(purchase.date).toLocaleDateString()}</td>
                                <td className="amount">{purchase.fractions.toLocaleString()}</td>
                                <td className="price">${purchase.price.toFixed(2)}</td>
                                <td className="total">${purchase.total.toLocaleString()}</td>
                                <td>
                                    <span className="token-badge">{purchase.token}</span>
                                </td>
                                <td>
                                    <a
                                        href={`https://etherscan.io/tx/${purchase.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tx-link"
                                    >
                                        {purchase.txHash.substring(0, 10)}...
                                        <span className="external-icon">↗</span>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Export Button */}
            <div className="history-actions">
                <button className="btn btn-secondary">
                    📄 Export to CSV
                </button>
                <button className="btn btn-secondary">
                    🔍 View on Etherscan
                </button>
            </div>

            {/* Rewards Summary */}
            <div className="rewards-projection">
                <h3>💰 Estimated Annual Rewards</h3>
                <div className="projection-content">
                    <div className="projection-stat">
                        <span className="label">Based on {totalFractions.toLocaleString()} fractions</span>
                        <span className="value">{(totalFractions * 0.0054 * 365).toFixed(0).toLocaleString()} IONX/year</span>
                    </div>
                    <div className="projection-stat">
                        <span className="label">Daily Rewards</span>
                        <span className="value">{(totalFractions * 0.0054).toFixed(2)} IONX</span>
                    </div>
                    <div className="projection-stat highlight">
                        <span className="label">Estimated ROI</span>
                        <span className="value">{((totalFractions * 0.0054 * 365 * 0.10 / totalSpent) * 100).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

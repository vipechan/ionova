import { useState } from 'react';
import EnhancedSaleDashboard from '../components/EnhancedSaleDashboard';
import PurchaseForm from '../components/PurchaseForm';
import HoldingsView from '../components/HoldingsView';
import AffiliatePanel from '../components/AffiliatePanel';
import PurchaseHistory from '../components/PurchaseHistory';

export default function ValidatorSale() {
    const [activeTab, setActiveTab] = useState('buy');

    return (
        <div className="validator-sale-page">
            <div className="page-header">
                <h1>⚡ Ionova Validator Fraction Sale</h1>
                <p className="page-subtitle">
                    Own a piece of Ionova's validators. Earn passive income from network fees.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buy')}
                >
                    🛒 Buy Fractions
                </button>
                <button
                    className={`tab ${activeTab === 'holdings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('holdings')}
                >
                    💼 My Holdings
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 Purchase History
                </button>
                <button
                    className={`tab ${activeTab === 'affiliate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('affiliate')}
                >
                    🤝 Affiliates
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && <EnhancedSaleDashboard />}
                {activeTab === 'buy' && (
                    <div className="buy-tab">
                        <div className="buy-layout">
                            <div className="purchase-section">
                                <PurchaseForm />
                            </div>
                            <div className="info-section">
                                <div className="info-card">
                                    <h3>💡 How It Works</h3>
                                    <ol>
                                        <li>Purchase validator fractions as ERC-1155 NFTs</li>
                                        <li>Earn proportional rewards from validator fees</li>
                                        <li>Claim IONX rewards daily</li>
                                        <li>Trade your fractions on NFT marketplaces</li>
                                    </ol>
                                </div>

                                <div className="info-card">
                                    <h3>📈 Benefits</h3>
                                    <ul>
                                        <li>✓ Passive income from validator rewards</li>
                                        <li>✓ Governance voting rights</li>
                                        <li>✓ Genesis IONX allocation</li>
                                        <li>✓ Fully tradeable ownership</li>
                                    </ul>
                                </div>

                                <div className="info-card">
                                    <h3>🔒 Security</h3>
                                    <ul>
                                        <li>✓ Audited smart contracts</li>
                                        <li>✓ Non-custodial (you control your NFTs)</li>
                                        <li>✓ Transparent on-chain</li>
                                        <li>✓ Emergency pause functionality</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'holdings' && <HoldingsView />}
                {activeTab === 'history' && <PurchaseHistory />}
                {activeTab === 'affiliate' && <AffiliatePanel />}
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
                <h2>❓ Frequently Asked Questions</h2>
                <div className="faq-grid">
                    <FAQItem
                        question="What are validator fractions?"
                        answer="Validator fractions are NFTs representing fractional ownership of Ionova validator nodes. Each validator is divided into 100,000 fractions, and there are 18 validators for sale (1.8M total fractions)."
                    />
                    <FAQItem
                        question="How do I earn rewards?"
                        answer="Fraction holders earn proportional rewards from validator fees and block rewards. Rewards accrue automatically and can be claimed as IONX tokens at any time."
                    />
                    <FAQItem
                        question="Can I sell my fractions?"
                        answer="Yes! Fractions are ERC-1155 NFTs that can be traded on OpenSea and other NFT marketplaces. You have full ownership and can sell or transfer them at any time."
                    />
                    <FAQItem
                        question="What is the bonding curve?"
                        answer="The price increases linearly from $10 to $100 as fractions are sold. Early buyers get the best price, and the price increases predictably as more fractions are sold."
                    />
                    <FAQItem
                        question="Is KYC required?"
                        answer="Yes, KYC verification is required for regulatory compliance. The process is simple and typically takes 10-15 minutes."
                    />
                    <FAQItem
                        question="What's the minimum purchase?"
                        answer="You can buy as little as 1 fraction (starting at $10) or as many as you want up to the available supply."
                    />
                    <FAQItem
                        question="How does the affiliate program work?"
                        answer="Share your referral link to earn 5%-20% commission on all purchases. Your commission rate increases as you achieve higher ranks based on your sales volume."
                    />
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`}>
            <div className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <h4>{question}</h4>
                <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && (
                <div className="faq-answer">
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

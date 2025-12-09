import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-pulse"></span>
                        🛡️ World's First Quantum-Safe L1 Blockchain
                    </div>
                    <h1 className="hero-title">
                        The Future-Proof
                        <span className="gradient-text"> Blockchain</span>
                    </h1>
                    <p className="hero-subtitle">
                        500,000 TPS • 1s Finality • Ultra-Low Fees • Quantum-Resistant
                    </p>
                    <p className="hero-description">
                        Ionova combines post-quantum cryptography, extreme performance, and sustainable economics
                        to deliver the most advanced Layer 1 blockchain for the post-quantum era.
                    </p>

                    <div className="hero-cta">
                        <Link to="/sale" className="btn btn-primary btn-lg">
                            <span>Get IONX Tokens</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <Link to="/developer" className="btn btn-secondary btn-lg">
                            <span>Start Building</span>
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <div className="stat-value">500K</div>
                            <div className="stat-label">TPS</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">$0.002</div>
                            <div className="stat-label">Per Transfer</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">1s</div>
                            <div className="stat-label">Finality</div>
                        </div>
                        <div className="stat">
                            <div className="stat-value">8-12%</div>
                            <div className="stat-label">Staking APR</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why Ionova?</h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon quantum">🛡️</div>
                            <h3>Quantum-Resistant</h3>
                            <p>Only L1 blockchain with post-quantum cryptography. Protected against future quantum computer attacks with NIST-standardized algorithms.</p>
                            <div className="feature-badge">10-20 year advantage</div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon performance">⚡</div>
                            <h3>Extreme Performance</h3>
                            <p>500,000 TPS via 8-shard parallel processing. 71x faster than Polygon, 16,667x faster than Ethereum.</p>
                            <div className="feature-badge">Zero reorg risk</div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon economics">💰</div>
                            <h3>Sustainable Economics</h3>
                            <p>Multi-source deflationary model with transaction fees + protocol revenue burns. Becomes deflationary by Year 10.</p>
                            <div className="feature-badge">Mathematically sound</div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon fees">💸</div>
                            <h3>Ultra-Low Costs</h3>
                            <p>Transfers: $0.002 • Swaps: $0.01 • NFT Mints: $0.015. Oracle-based governance maintains stable USD fees.</p>
                            <div className="feature-badge">100-3000x cheaper</div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon developer">👨‍💻</div>
                            <h3>Developer-Friendly</h3>
                            <p>Full EVM compatibility. Deploy Ethereum dApps instantly. Solidity support with comprehensive tooling.</p>
                            <div className="feature-badge">FREE verification</div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon ecosystem">🌐</div>
                            <h3>Complete DeFi Ecosystem</h3>
                            <p>Pre-deployed DEX, lending, liquid staking, NFT marketplace, and DAO governance ready at launch.</p>
                            <div className="feature-badge">Ready to use</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="comparison">
                <div className="container">
                    <h2 className="section-title">How We Compare</h2>
                    <p className="section-subtitle">Ionova vs Major L1 Blockchains</p>

                    <div className="comparison-table-container">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th className="highlight">Ionova</th>
                                    <th>Ethereum</th>
                                    <th>Solana</th>
                                    <th>Polygon</th>
                                    <th>BNB Chain</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>TPS</td>
                                    <td className="highlight"><strong>500,000</strong></td>
                                    <td>30</td>
                                    <td>65,000</td>
                                    <td>7,000</td>
                                    <td>2,000</td>
                                </tr>
                                <tr>
                                    <td>Finality</td>
                                    <td className="highlight"><strong>1s</strong></td>
                                    <td>12+ min</td>
                                    <td>0.4s</td>
                                    <td>2s</td>
                                    <td>3s</td>
                                </tr>
                                <tr>
                                    <td>Transfer Fee</td>
                                    <td className="highlight"><strong>$0.002</strong></td>
                                    <td>$0.38-$5</td>
                                    <td>$0.001</td>
                                    <td>$0.001-$0.002</td>
                                    <td>$0.10-$0.50</td>
                                </tr>
                                <tr>
                                    <td>Swap Fee</td>
                                    <td className="highlight"><strong>$0.01</strong></td>
                                    <td>$5-$30</td>
                                    <td>$0.01</td>
                                    <td>$0.01-$0.10</td>
                                    <td>$0.50-$2</td>
                                </tr>
                                <tr>
                                    <td>EVM Compatible</td>
                                    <td className="highlight">✅</td>
                                    <td>✅</td>
                                    <td>❌</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                </tr>
                                <tr>
                                    <td>Quantum-Safe</td>
                                    <td className="highlight">✅</td>
                                    <td>❌</td>
                                    <td>❌</td>
                                    <td>❌</td>
                                    <td>❌</td>
                                </tr>
                                <tr>
                                    <td>Deflationary</td>
                                    <td className="highlight"><strong>Year 10+</strong></td>
                                    <td>Partial</td>
                                    <td>No</td>
                                    <td>Partial</td>
                                    <td>Partial</td>
                                </tr>
                                <tr>
                                    <td>Staking APR</td>
                                    <td className="highlight"><strong>8-12%</strong></td>
                                    <td>3-5%</td>
                                    <td>6-8%</td>
                                    <td>4-6%</td>
                                    <td>2-6%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="comparison-summary">
                        <div className="advantage">
                            <span className="advantage-icon">⚡</span>
                            <strong>71x faster</strong> than Polygon
                        </div>
                        <div className="advantage">
                            <span className="advantage-icon">💰</span>
                            <strong>100-3000x cheaper</strong> than Ethereum
                        </div>
                        <div className="advantage">
                            <span className="advantage-icon">🛡️</span>
                            <strong>Only quantum-safe</strong> L1 blockchain
                        </div>
                        <div className="advantage">
                            <span className="advantage-icon">📈</span>
                            <strong>Deflationary</strong> by Year 10
                        </div>
                    </div>
                </div>
            </section>

            {/* Tokenomics Highlight */}
            <section className="tokenomics-preview">
                <div className="container">
                    <div className="tokenomics-content">
                        <div className="tokenomics-text">
                            <h2>Sustainable Multi-Source Burn Model</h2>
                            <p className="lead">Four complementary mechanisms ensure long-term deflationary pressure:</p>

                            <div className="burn-sources">
                                <div className="burn-source">
                                    <div className="burn-icon">🔥</div>
                                    <div className="burn-details">
                                        <h4>Transaction Fee Burns</h4>
                                        <p>100% of base fee burned (EIP-1559 enhanced)</p>
                                        <div className="burn-stat">18M-684M IONX/year</div>
                                    </div>
                                </div>

                                <div className="burn-source primary">
                                    <div className="burn-icon">⭐</div>
                                    <div className="burn-details">
                                        <h4>Protocol Revenue Burns</h4>
                                        <p>40% of DEX/lending fees → buyback & burn</p>
                                        <div className="burn-stat">20M-250M IONX/year</div>
                                    </div>
                                </div>

                                <div className="burn-source">
                                    <div className="burn-icon">🏛️</div>
                                    <div className="burn-details">
                                        <h4>Treasury Safety Burns</h4>
                                        <p>225M IONX reserve (DAO governed)</p>
                                        <div className="burn-stat">Up to 225M IONX</div>
                                    </div>
                                </div>

                                <div className="burn-source">
                                    <div className="burn-icon">⚔️</div>
                                    <div className="burn-details">
                                        <h4>Slashing Penalties</h4>
                                        <p>100% of slashed stake burned</p>
                                        <div className="burn-stat">~1M IONX/year</div>
                                    </div>
                                </div>
                            </div>

                            <div className="deflationary-timeline">
                                <div className="timeline-item">
                                    <div className="timeline-year">Year 1</div>
                                    <div className="timeline-status growing">+7.5% inflation</div>
                                </div>
                                <div className="timeline-arrow">→</div>
                                <div className="timeline-item">
                                    <div className="timeline-year">Year 7</div>
                                    <div className="timeline-status near-zero">+1.3% inflation</div>
                                </div>
                                <div className="timeline-arrow">→</div>
                                <div className="timeline-item active">
                                    <div className="timeline-year">Year 10</div>
                                    <div className="timeline-status deflationary">-1.7% DEFLATIONARY ✅</div>
                                </div>
                                <div className="timeline-arrow">→</div>
                                <div className="timeline-item">
                                    <div className="timeline-year">Year 15</div>
                                    <div className="timeline-status strong-deflationary">-4.6% Strong Deflation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Oracle Governance Highlight */}
            <section className="oracle-governance">
                <div className="container">
                    <h2 className="section-title">Oracle-Based Fee Governance</h2>
                    <p className="section-subtitle">Fees stay stable in USD, regardless of IONX price</p>

                    <div className="oracle-demo">
                        <div className="price-scenario">
                            <div className="scenario-card">
                                <div className="ionx-price">$0.10/IONX</div>
                                <div className="base-fee">Base fee: 0.50 IONX</div>
                                <div className="usd-cost">= $0.05</div>
                            </div>

                            <div className="scenario-arrow">→</div>

                            <div className="scenario-card">
                                <div className="ionx-price">$1/IONX</div>
                                <div className="base-fee">Base fee: 0.05 IONX</div>
                                <div className="usd-cost">= $0.05</div>
                            </div>

                            <div className="scenario-arrow">→</div>

                            <div className="scenario-card">
                                <div className="ionx-price">$100/IONX</div>
                                <div className="base-fee">Base fee: 0.0005 IONX</div>
                                <div className="usd-cost">= $0.05</div>
                            </div>

                            <div className="scenario-arrow">→</div>

                            <div className="scenario-card highlight">
                                <div className="ionx-price">$1000/IONX</div>
                                <div className="base-fee">Base fee: 0.00005 IONX</div>
                                <div className="usd-cost">= $0.05 ✅</div>
                            </div>
                        </div>

                        <div className="oracle-features">
                            <div className="oracle-feature">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>DAO Governed (66% approval required)</span>
                            </div>
                            <div className="oracle-feature">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Multi-oracle consensus (manipulation-resistant)</span>
                            </div>
                            <div className="oracle-feature">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Emergency mode with 7-day timelock</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Build the Future?</h2>
                    <p>Join the quantum-safe revolution today</p>

                    <div className="cta-buttons">
                        <Link to="/sale" className="btn btn-primary btn-lg">
                            Get IONX Tokens
                        </Link>
                        <Link to="/developer" className="btn btn-secondary btn-lg">
                            Developer Docs
                        </Link>
                        <Link to="/faucet" className="btn btn-outline btn-lg">
                            Get Testnet IONX
                        </Link>
                    </div>

                    <div className="social-proof">
                        <div className="proof-item">
                            <strong>100</strong>
                            <span>Validators</span>
                        </div>
                        <div className="proof-item">
                            <strong>$10B+</strong>
                            <span>TVL Target</span>
                        </div>
                        <div className="proof-item">
                            <strong>2025</strong>
                            <span>Mainnet Launch</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

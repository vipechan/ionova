import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to Ionova Network</h1>
                    <p className="hero-subtitle">
                        The High-Performance Blockchain for DeFi, Gaming, and Education
                    </p>
                    <div className="hero-actions">
                        <Link to="/sale" className="btn btn-primary btn-large">
                            Join Validator Sale
                        </Link>
                        <Link to="/university" className="btn btn-secondary btn-large">
                            Start Learning
                        </Link>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="feature-card">
                    <div className="feature-icon">🚀</div>
                    <h3>Validator Sale</h3>
                    <p>Participate in the network security and earn rewards by becoming a validator.</p>
                    <Link to="/sale" className="feature-link">Go to Sale &rarr;</Link>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🎓</div>
                    <h3>Ionova University</h3>
                    <p>Learn blockchain development and earn IONX tokens and NFT certificates.</p>
                    <Link to="/university" className="feature-link">Start Learning &rarr;</Link>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🚰</div>
                    <h3>Testnet Faucet</h3>
                    <p>Get free testnet IONX tokens to experiment and build on Ionova.</p>
                    <Link to="/faucet" className="feature-link">Get Tokens &rarr;</Link>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🔍</div>
                    <h3>Block Explorer</h3>
                    <p>View transactions, blocks, and network activity in real-time.</p>
                    <Link to="/explorer" className="feature-link">View Explorer &rarr;</Link>
                </div>
            </section>

            <section className="stats-section">
                <div className="stat-item">
                    <span className="stat-value">500k+</span>
                    <span className="stat-label">TPS Capacity</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">&lt;1s</span>
                    <span className="stat-label">Finality</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">$0.0001</span>
                    <span className="stat-label">Avg Transaction Fee</span>
                </div>
            </section>
        </div>
    );
};

export default Home;

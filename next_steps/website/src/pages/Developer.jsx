import './Developer.css';

export default function Developer() {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="developer-container">
            <div className="dev-hero">
                <h1>🛠️ Developer Hub</h1>
                <p>Build the future of finance on Ionova. Everything you need to integrate, deploy, and scale.</p>
                <div className="hero-buttons">
                    <a href="https://docs.ionova.network" className="btn btn-primary">Read Documentation</a>
                    <a href="https://github.com/ionova" className="btn btn-secondary">View GitHub</a>
                </div>
            </div>

            <div className="network-config-section">
                <h2>Network Configuration</h2>
                <div className="config-card">
                    <div className="config-row">
                        <span className="label">Network Name</span>
                        <span className="value">Ionova Devnet</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('Ionova Devnet')}>📋</button>
                    </div>
                    <div className="config-row">
                        <span className="label">RPC URL</span>
                        <span className="value">http://72.61.210.50:27000</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('http://72.61.210.50:27000')}>📋</button>
                    </div>
                    <div className="config-row">
                        <span className="label">Chain ID</span>
                        <span className="value">31337</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('31337')}>📋</button>
                    </div>
                    <div className="config-row">
                        <span className="label">Currency Symbol</span>
                        <span className="value">IONX</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('IONX')}>📋</button>
                    </div>
                    <div className="config-row">
                        <span className="label">Block Explorer</span>
                        <span className="value">http://localhost:5173/explorer</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('http://localhost:5173/explorer')}>📋</button>
                    </div>
                </div>
            </div>

            <div className="contracts-section">
                <h2>Smart Contracts</h2>
                <div className="table-responsive">
                    <table className="contracts-table">
                        <thead>
                            <tr>
                                <th>Contract Name</th>
                                <th>Address</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ValidatorFractionNFT</td>
                                <td className="mono">0x5FbDB2315678afecb367f032d93F642f64180aa3</td>
                                <td>ERC-1155 Token for Validator Fractions</td>
                                <td><a href="#" className="link">View ABI</a></td>
                            </tr>
                            <tr>
                                <td>IonovaGovernance</td>
                                <td className="mono">0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</td>
                                <td>Governance and Voting Contract</td>
                                <td><a href="#" className="link">View ABI</a></td>
                            </tr>
                            <tr>
                                <td>IONX Token</td>
                                <td className="mono">0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0</td>
                                <td>Native ERC-20 Utility Token</td>
                                <td><a href="#" className="link">View ABI</a></td>
                            </tr>
                            <tr>
                                <td>StakingPool</td>
                                <td className="mono">0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9</td>
                                <td>Validator Staking Contract</td>
                                <td><a href="#" className="link">View ABI</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="resources-grid">
                <div className="resource-card">
                    <div className="icon">📚</div>
                    <h3>SDK Documentation</h3>
                    <p>Learn how to interact with Ionova using our JavaScript/TypeScript SDK.</p>
                    <a href="#" className="learn-more">Explore SDK →</a>
                </div>
                <div className="resource-card">
                    <div className="icon">⚡</div>
                    <h3>Node Setup</h3>
                    <p>Step-by-step guide to setting up a validator or RPC node.</p>
                    <a href="#" className="learn-more">Setup Node →</a>
                </div>
                <div className="resource-card">
                    <div className="icon">🔐</div>
                    <h3>Security Audits</h3>
                    <p>Read our latest security reports and bug bounty program details.</p>
                    <a href="#" className="learn-more">View Audits →</a>
                </div>
            </div>
        </div>
    );
}

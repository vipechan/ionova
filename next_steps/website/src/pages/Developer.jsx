import { useState } from 'react';
import './Developer.css';

export default function Developer() {
    const [activeTab, setActiveTab] = useState('quickstart');

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

            {/* Tab Navigation */}
            <div className="dev-tabs">
                <button
                    className={activeTab === 'quickstart' ? 'active' : ''}
                    onClick={() => setActiveTab('quickstart')}
                >
                    🚀 Quick Start
                </button>
                <button
                    className={activeTab === 'sdk' ? 'active' : ''}
                    onClick={() => setActiveTab('sdk')}
                >
                    📦 SDK
                </button>
                <button
                    className={activeTab === 'tutorials' ? 'active' : ''}
                    onClick={() => setActiveTab('tutorials')}
                >
                    📖 Tutorials
                </button>
                <button
                    className={activeTab === 'demos' ? 'active' : ''}
                    onClick={() => setActiveTab('demos')}
                >
                    🎮 Live Demos
                </button>
                <button
                    className={activeTab === 'contracts' ? 'active' : ''}
                    onClick={() => setActiveTab('contracts')}
                >
                    📜 Smart Contracts
                </button>
                <button
                    className={activeTab === 'templates' ? 'active' : ''}
                    onClick={() => setActiveTab('templates')}
                >
                    🎨 Templates
                </button>
            </div>

            {/* Quick Start Tab */}
            {activeTab === 'quickstart' && (
                <div className="tab-content">
                    <h2>⚡ Quick Start Guide</h2>

                    <div className="step-card">
                        <h3>Step 1: Add Ionova Network to MetaMask</h3>
                        <div className="network-config-section">
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
                                    <span className="value">http://72.61.210.50/explorer</span>
                                    <button className="copy-btn" onClick={() => copyToClipboard('http://72.61.210.50/explorer')}>📋</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="step-card">
                        <h3>Step 2: Get Test IONX from Faucet</h3>
                        <p>Visit the <a href="/faucet" className="link">Ionova Faucet</a> to get free test IONX tokens for development.</p>
                        <div className="code-block">
                            <code>
                                curl -X POST http://72.61.210.50/faucet -H "Content-Type: application/json" -d '&#123;"address":"YOUR_WALLET_ADDRESS"&#125;'
                            </code>
                            <button className="copy-btn" onClick={() => copyToClipboard('curl -X POST http://72.61.210.50/faucet -H "Content-Type: application/json" -d \'{"address":"YOUR_WALLET_ADDRESS"}\'')}>📋</button>
                        </div>
                    </div>

                    <div className="step-card">
                        <h3>Step 3: Install Ionova SDK</h3>
                        <div className="code-block">
                            <code>npm install @ionova/sdk wagmi viem</code>
                            <button className="copy-btn" onClick={() => copyToClipboard('npm install @ionova/sdk wagmi viem')}>📋</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SDK Tab */}
            {activeTab === 'sdk' && (
                <div className="tab-content">
                    <h2>📦 Ionova SDK</h2>

                    <div className="sdk-section">
                        <h3>Installation</h3>
                        <div className="code-block">
                            <code>npm install @ionova/sdk ethers</code>
                            <button className="copy-btn" onClick={() => copyToClipboard('npm install @ionova/sdk ethers')}>📋</button>
                        </div>
                    </div>

                    <div className="sdk-section">
                        <h3>Basic Setup</h3>
                        <div className="code-block">
                            <pre>{`import { IonovaSDK } from '@ionova/sdk';

// Initialize SDK
const ionova = new IonovaSDK({
  rpcUrl: 'http://72.61.210.50:27000',
  chainId: 31337
});

// Connect wallet
await ionova.connect();`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`import { IonovaSDK } from '@ionova/sdk';\n\n// Initialize SDK\nconst ionova = new IonovaSDK({\n  rpcUrl: 'http://72.61.210.50:27000',\n  chainId: 31337\n});\n\n// Connect wallet\nawait ionova.connect();`)}>📋</button>
                        </div>
                    </div>

                    <div className="sdk-section">
                        <h3>Buy Validator Fractions</h3>
                        <div className="code-block">
                            <pre>{`// Purchase validator fractions
const tx = await ionova.validatorSale.buyFractions({
  quantity: 100,
  paymentToken: 'USDC',
  referrer: '0x0000000000000000000000000000000000000000'
});

await tx.wait();
console.log('Purchase successful!', tx.hash);`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`// Purchase validator fractions\nconst tx = await ionova.validatorSale.buyFractions({\n  quantity: 100,\n  paymentToken: 'USDC',\n  referrer: '0x0000000000000000000000000000000000000000'\n});\n\nawait tx.wait();\nconsole.log('Purchase successful!', tx.hash);`)}>📋</button>
                        </div>
                    </div>

                    <div className="sdk-section">
                        <h3>Check Holdings</h3>
                        <div className="code-block">
                            <pre>{`// Get user's validator fraction balance
const balance = await ionova.validatorSale.getBalance(address);
console.log(\`You own \${balance} fractions\`);

// Get pending rewards
const rewards = await ionova.validatorSale.getPendingRewards(address);
console.log(\`Pending rewards: \${rewards} IONX\`);`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`// Get user's validator fraction balance\nconst balance = await ionova.validatorSale.getBalance(address);\nconsole.log(\`You own \${balance} fractions\`);\n\n// Get pending rewards\nconst rewards = await ionova.validatorSale.getPendingRewards(address);\nconsole.log(\`Pending rewards: \${rewards} IONX\`);`)}>📋</button>
                        </div>
                    </div>

                    <div className="sdk-section">
                        <h3>Claim Rewards</h3>
                        <div className="code-block">
                            <pre>{`// Claim accumulated rewards
const claimTx = await ionova.validatorSale.claimRewards();
await claimTx.wait();
console.log('Rewards claimed!');`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`// Claim accumulated rewards\nconst claimTx = await ionova.validatorSale.claimRewards();\nawait claimTx.wait();\nconsole.log('Rewards claimed!');`)}>📋</button>
                        </div>
                    </div>

                    <div className="sdk-section">
                        <h3>React Integration with Wagmi</h3>
                        <div className="code-block">
                            <pre>{`import { useAccount, useWriteContract } from 'wagmi';

function ValidatorPurchase() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const buyFractions = async (quantity) => {
    writeContract({
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      abi: VALIDATOR_SALE_ABI,
      functionName: 'buyFractions',
      args: [quantity, '0x0', USDC_ADDRESS]
    });
  };

  return (
    <button onClick={() => buyFractions(100)}>
      Buy 100 Fractions
    </button>
  );
}`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`import { useAccount, useWriteContract } from 'wagmi';\n\nfunction ValidatorPurchase() {\n  const { address } = useAccount();\n  const { writeContract } = useWriteContract();\n\n  const buyFractions = async (quantity) => {\n    writeContract({\n      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',\n      abi: VALIDATOR_SALE_ABI,\n      functionName: 'buyFractions',\n      args: [quantity, '0x0', USDC_ADDRESS]\n    });\n  };\n\n  return (\n    <button onClick={() => buyFractions(100)}>\n      Buy 100 Fractions\n    </button>\n  );\n}`)}>📋</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tutorials Tab */}
            {activeTab === 'tutorials' && (
                <div className="tab-content">
                    <h2>📖 Step-by-Step Tutorials</h2>

                    <div className="tutorial-section">
                        <div className="tutorial-card">
                            <div className="tutorial-header">
                                <h3>🎯 Tutorial 1: Your First DApp on Ionova</h3>
                                <span className="difficulty beginner">Beginner</span>
                                <span className="duration">⏱️ 15 min</span>
                            </div>
                            <p>Learn how to build a simple token transfer DApp from scratch.</p>
                            <div className="tutorial-steps">
                                <div className="step">
                                    <strong>Step 1:</strong> Set up your development environment
                                    <div className="code-block-small">
                                        <code>npx create-react-app my-first-dapp && cd my-first-dapp</code>
                                    </div>
                                </div>
                                <div className="step">
                                    <strong>Step 2:</strong> Install Ionova SDK and dependencies
                                    <div className="code-block-small">
                                        <code>npm install wagmi viem @tanstack/react-query</code>
                                    </div>
                                </div>
                                <div className="step">
                                    <strong>Step 3:</strong> Configure Ionova network in your app
                                </div>
                                <div className="step">
                                    <strong>Step 4:</strong> Build the transfer UI component
                                </div>
                                <div className="step">
                                    <strong>Step 5:</strong> Test your DApp on Ionova Devnet
                                </div>
                            </div>
                            <a href="https://docs.ionova.network/tutorials/first-dapp" className="btn btn-primary">Start Tutorial →</a>
                        </div>

                        <div className="tutorial-card">
                            <div className="tutorial-header">
                                <h3>💰 Tutorial 2: Building a Staking Interface</h3>
                                <span className="difficulty intermediate">Intermediate</span>
                                <span className="duration">⏱️ 30 min</span>
                            </div>
                            <p>Create a full-featured staking dashboard with rewards tracking.</p>
                            <div className="tutorial-steps">
                                <div className="step">
                                    <strong>Step 1:</strong> Clone the staking template
                                </div>
                                <div className="step">
                                    <strong>Step 2:</strong> Connect to StakingPool contract
                                </div>
                                <div className="step">
                                    <strong>Step 3:</strong> Implement stake/unstake functions
                                </div>
                                <div className="step">
                                    <strong>Step 4:</strong> Display real-time rewards
                                </div>
                                <div className="step">
                                    <strong>Step 5:</strong> Add transaction history
                                </div>
                            </div>
                            <a href="https://docs.ionova.network/tutorials/staking-interface" className="btn btn-primary">Start Tutorial →</a>
                        </div>

                        <div className="tutorial-card">
                            <div className="tutorial-header">
                                <h3>🛒 Tutorial 3: Integrating Validator Sale</h3>
                                <span className="difficulty intermediate">Intermediate</span>
                                <span className="duration">⏱️ 25 min</span>
                            </div>
                            <p>Add validator fraction purchasing to your DApp.</p>
                            <div className="tutorial-steps">
                                <div className="step">
                                    <strong>Step 1:</strong> Import ValidatorSale contract ABI
                                </div>
                                <div className="step">
                                    <strong>Step 2:</strong> Implement token approval flow
                                </div>
                                <div className="step">
                                    <strong>Step 3:</strong> Build purchase form with quantity selector
                                </div>
                                <div className="step">
                                    <strong>Step 4:</strong> Display user holdings and rewards
                                </div>
                                <div className="step">
                                    <strong>Step 5:</strong> Add referral link generation
                                </div>
                            </div>
                            <a href="https://docs.ionova.network/tutorials/validator-sale" className="btn btn-primary">Start Tutorial →</a>
                        </div>

                        <div className="tutorial-card">
                            <div className="tutorial-header">
                                <h3>🗳️ Tutorial 4: DAO Governance Integration</h3>
                                <span className="difficulty advanced">Advanced</span>
                                <span className="duration">⏱️ 45 min</span>
                            </div>
                            <p>Build a complete governance portal with proposal creation and voting.</p>
                            <div className="tutorial-steps">
                                <div className="step">
                                    <strong>Step 1:</strong> Set up governance contract connection
                                </div>
                                <div className="step">
                                    <strong>Step 2:</strong> Create proposal submission form
                                </div>
                                <div className="step">
                                    <strong>Step 3:</strong> Implement voting mechanism
                                </div>
                                <div className="step">
                                    <strong>Step 4:</strong> Display proposal status and results
                                </div>
                                <div className="step">
                                    <strong>Step 5:</strong> Add delegation features
                                </div>
                            </div>
                            <a href="https://docs.ionova.network/tutorials/governance" className="btn btn-primary">Start Tutorial →</a>
                        </div>
                    </div>

                    <div className="video-tutorials-section">
                        <h3>🎥 Video Tutorials</h3>
                        <div className="video-grid">
                            <div className="video-card">
                                <div className="video-thumbnail">▶️</div>
                                <h4>Getting Started with Ionova</h4>
                                <p>5:30 min • Beginner</p>
                            </div>
                            <div className="video-card">
                                <div className="video-thumbnail">▶️</div>
                                <h4>Smart Contract Deployment</h4>
                                <p>12:15 min • Intermediate</p>
                            </div>
                            <div className="video-card">
                                <div className="video-thumbnail">▶️</div>
                                <h4>Building with Wagmi & Viem</h4>
                                <p>18:45 min • Intermediate</p>
                            </div>
                        </div>
                    </div>

                    <div className="gitbook-section">
                        <h3>📚 Complete Documentation (GitBook)</h3>
                        <div className="gitbook-links">
                            <a href="https://docs.ionova.network" className="gitbook-link">
                                <span className="icon">📖</span>
                                <div>
                                    <h4>Full Documentation</h4>
                                    <p>Comprehensive guides, API reference, and examples</p>
                                </div>
                                <span className="arrow">→</span>
                            </a>
                            <a href="https://docs.ionova.network/api" className="gitbook-link">
                                <span className="icon">⚙️</span>
                                <div>
                                    <h4>API Reference</h4>
                                    <p>Complete SDK and contract method documentation</p>
                                </div>
                                <span className="arrow">→</span>
                            </a>
                            <a href="https://docs.ionova.network/guides" className="gitbook-link">
                                <span className="icon">🎓</span>
                                <div>
                                    <h4>Developer Guides</h4>
                                    <p>Best practices, patterns, and architecture guides</p>
                                </div>
                                <span className="arrow">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Demos Tab */}
            {activeTab === 'demos' && (
                <div className="tab-content">
                    <h2>🎮 Interactive Live Demos</h2>

                    <div className="demo-section">
                        <div className="demo-card featured">
                            <div className="demo-badge">🔥 Most Popular</div>
                            <h3>Validator Fraction Purchase</h3>
                            <p>Try buying validator fractions with test tokens. Experience the full flow from approval to purchase.</p>
                            <div className="demo-features">
                                <span>✓ Token Approval</span>
                                <span>✓ Price Calculator</span>
                                <span>✓ Transaction Tracking</span>
                            </div>
                            <a href="/sale" className="btn btn-primary">Launch Demo →</a>
                        </div>

                        <div className="demo-card">
                            <h3>Token Swap Interface</h3>
                            <p>Swap between IONX and test stablecoins with real-time price updates.</p>
                            <div className="demo-features">
                                <span>✓ Live Pricing</span>
                                <span>✓ Slippage Control</span>
                                <span>✓ Multi-hop Routing</span>
                            </div>
                            <button className="btn btn-secondary" disabled>Coming Soon</button>
                        </div>

                        <div className="demo-card">
                            <h3>NFT Marketplace</h3>
                            <p>Browse, buy, and sell validator fraction NFTs on the secondary market.</p>
                            <div className="demo-features">
                                <span>✓ ERC-1155 Support</span>
                                <span>✓ Batch Transfers</span>
                                <span>✓ Royalties</span>
                            </div>
                            <button className="btn btn-secondary" disabled>Coming Soon</button>
                        </div>

                        <div className="demo-card">
                            <h3>Governance Voting</h3>
                            <p>Create proposals and vote on network upgrades and parameter changes.</p>
                            <div className="demo-features">
                                <span>✓ Proposal Creation</span>
                                <span>✓ Weighted Voting</span>
                                <span>✓ Delegation</span>
                            </div>
                            <button className="btn btn-secondary" disabled>Coming Soon</button>
                        </div>
                    </div>

                    <div className="playground-section">
                        <h3>🧪 Interactive Code Playground</h3>
                        <p>Test Ionova SDK methods directly in your browser</p>
                        <div className="playground-container">
                            <div className="playground-editor">
                                <div className="editor-header">
                                    <span>JavaScript</span>
                                    <button className="run-btn">▶ Run Code</button>
                                </div>
                                <pre className="code-editor">{`// Try it yourself!
import { IonovaSDK } from '@ionova/sdk';

const ionova = new IonovaSDK({
  rpcUrl: 'http://72.61.210.50:27000',
  chainId: 31337
});

// Get current block number
const blockNumber = await ionova.getBlockNumber();
console.log('Current block:', blockNumber);

// Get IONX balance
const balance = await ionova.getBalance(address);
console.log('Balance:', balance);`}</pre>
                            </div>
                            <div className="playground-output">
                                <div className="output-header">Console Output</div>
                                <pre className="output-content">
                                    Click "Run Code" to see results...
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="sandbox-section">
                        <h3>🏖️ CodeSandbox Examples</h3>
                        <div className="sandbox-grid">
                            <div className="sandbox-card">
                                <h4>React + Wagmi Starter</h4>
                                <p>Basic setup with wallet connection</p>
                                <a href="https://codesandbox.io/s/ionova-react-wagmi" className="sandbox-link">Open in CodeSandbox →</a>
                            </div>
                            <div className="sandbox-card">
                                <h4>Next.js Full Stack</h4>
                                <p>Complete DApp with backend API</p>
                                <a href="https://codesandbox.io/s/ionova-nextjs" className="sandbox-link">Open in CodeSandbox →</a>
                            </div>
                            <div className="sandbox-card">
                                <h4>Vue.js Integration</h4>
                                <p>Ionova SDK with Vue 3 composition API</p>
                                <a href="https://codesandbox.io/s/ionova-vue" className="sandbox-link">Open in CodeSandbox →</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Contracts Tab */}
            {activeTab === 'contracts' && (
                <div className="tab-content">
                    <h2>📜 Smart Contracts</h2>
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
                                    <td className="mono">
                                        0x5FbDB2315678afecb367f032d93F642f64180aa3
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0x5FbDB2315678afecb367f032d93F642f64180aa3')}>📋</button>
                                    </td>
                                    <td>ERC-1155 Token for Validator Fractions</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                                <tr>
                                    <td>IonovaGovernance</td>
                                    <td className="mono">
                                        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512')}>📋</button>
                                    </td>
                                    <td>Governance and Voting Contract</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                                <tr>
                                    <td>IONX Token</td>
                                    <td className="mono">
                                        0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0')}>📋</button>
                                    </td>
                                    <td>Native ERC-20 Utility Token</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                                <tr>
                                    <td>StakingPool</td>
                                    <td className="mono">
                                        0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9')}>📋</button>
                                    </td>
                                    <td>Validator Staking Contract</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                                <tr>
                                    <td>USDC (Test)</td>
                                    <td className="mono">
                                        0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9')}>📋</button>
                                    </td>
                                    <td>Test USDC for Devnet</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                                <tr>
                                    <td>USDT (Test)</td>
                                    <td className="mono">
                                        0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
                                        <button className="copy-btn-small" onClick={() => copyToClipboard('0x5FC8d32690cc91D4c39d9d3abcBD16989F875707')}>📋</button>
                                    </td>
                                    <td>Test USDT for Devnet</td>
                                    <td><a href="#" className="link">View ABI</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="tab-content">
                    <h2>🎨 Ready-Made Templates</h2>

                    <div className="templates-grid">
                        <div className="template-card">
                            <h3>🛒 Validator Sale DApp</h3>
                            <p>Complete React app for buying and managing validator fractions</p>
                            <div className="template-features">
                                <span className="badge">React</span>
                                <span className="badge">Wagmi</span>
                                <span className="badge">Viem</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app validator-sale</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app validator-sale')}>📋</button>
                            </div>
                        </div>

                        <div className="template-card">
                            <h3>💰 Staking Dashboard</h3>
                            <p>Full-featured staking interface with rewards tracking</p>
                            <div className="template-features">
                                <span className="badge">Next.js</span>
                                <span className="badge">TypeScript</span>
                                <span className="badge">TailwindCSS</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app staking-dashboard</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app staking-dashboard')}>📋</button>
                            </div>
                        </div>

                        <div className="template-card">
                            <h3>🗳️ Governance Portal</h3>
                            <p>DAO governance with proposal creation and voting</p>
                            <div className="template-features">
                                <span className="badge">React</span>
                                <span className="badge">Web3Modal</span>
                                <span className="badge">Ethers.js</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app governance</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app governance')}>📋</button>
                            </div>
                        </div>

                        <div className="template-card">
                            <h3>🔍 Block Explorer</h3>
                            <p>Custom block explorer for Ionova network</p>
                            <div className="template-features">
                                <span className="badge">Vue.js</span>
                                <span className="badge">GraphQL</span>
                                <span className="badge">Chart.js</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app explorer</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app explorer')}>📋</button>
                            </div>
                        </div>

                        <div className="template-card">
                            <h3>💳 Wallet Integration</h3>
                            <p>Multi-wallet connection with account management</p>
                            <div className="template-features">
                                <span className="badge">RainbowKit</span>
                                <span className="badge">Wagmi</span>
                                <span className="badge">React</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app wallet-connect</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app wallet-connect')}>📋</button>
                            </div>
                        </div>

                        <div className="template-card">
                            <h3>📊 Analytics Dashboard</h3>
                            <p>Real-time network statistics and metrics</p>
                            <div className="template-features">
                                <span className="badge">React</span>
                                <span className="badge">Recharts</span>
                                <span className="badge">WebSocket</span>
                            </div>
                            <div className="code-block-small">
                                <code>npx create-ionova-app analytics</code>
                                <button className="copy-btn" onClick={() => copyToClipboard('npx create-ionova-app analytics')}>📋</button>
                            </div>
                        </div>
                    </div>

                    <div className="manual-setup-section">
                        <h3>📝 Manual Setup Example</h3>
                        <p>Create a basic Ionova DApp from scratch:</p>
                        <div className="code-block">
                            <pre>{`# Create new React app
npx create-react-app my-ionova-dapp
cd my-ionova-dapp

# Install dependencies
npm install wagmi viem @tanstack/react-query

# Configure Ionova network
# Add to src/config.js:

export const ionovaDevnet = {
  id: 31337,
  name: 'Ionova Devnet',
  network: 'ionova-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ionova',
    symbol: 'IONX',
  },
  rpcUrls: {
    default: { http: ['http://72.61.210.50:27000'] },
    public: { http: ['http://72.61.210.50:27000'] },
  },
};

# Start building!
npm start`}</pre>
                            <button className="copy-btn" onClick={() => copyToClipboard(`# Create new React app\nnpx create-react-app my-ionova-dapp\ncd my-ionova-dapp\n\n# Install dependencies\nnpm install wagmi viem @tanstack/react-query\n\n# Configure Ionova network\n# Add to src/config.js:\n\nexport const ionovaDevnet = {\n  id: 31337,\n  name: 'Ionova Devnet',\n  network: 'ionova-devnet',\n  nativeCurrency: {\n    decimals: 18,\n    name: 'Ionova',\n    symbol: 'IONX',\n  },\n  rpcUrls: {\n    default: { http: ['http://72.61.210.50:27000'] },\n    public: { http: ['http://72.61.210.50:27000'] },\n  },\n};\n\n# Start building!\nnpm start`)}>📋</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resources Section */}
            <div className="resources-grid">
                <div className="resource-card">
                    <div className="icon">📚</div>
                    <h3>Full Documentation</h3>
                    <p>Complete API reference, guides, and tutorials for building on Ionova.</p>
                    <a href="https://docs.ionova.network" className="learn-more">Read Docs →</a>
                </div>
                <div className="resource-card">
                    <div className="icon">💬</div>
                    <h3>Developer Discord</h3>
                    <p>Join our community of developers building the future of DeFi.</p>
                    <a href="https://discord.gg/ionova" className="learn-more">Join Discord →</a>
                </div>
                <div className="resource-card">
                    <div className="icon">🐛</div>
                    <h3>Bug Bounty Program</h3>
                    <p>Earn rewards by finding and reporting security vulnerabilities.</p>
                    <a href="https://ionova.network/bounty" className="learn-more">View Program →</a>
                </div>
            </div>
        </div>
    );
}

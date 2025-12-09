import { useState } from 'react';
import './Explorer.css';

export default function Explorer() {
    const [network, setNetwork] = useState('testnet');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        // Mock search logic
        if (searchQuery.startsWith('0x') && searchQuery.length === 66) {
            setSearchResult({ type: 'transaction', id: searchQuery });
        } else if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
            setSearchResult({ type: 'address', id: searchQuery });
        } else if (!isNaN(searchQuery) && searchQuery.length > 0) {
            setSearchResult({ type: 'block', id: searchQuery });
        } else {
            setSearchResult({ type: 'error', message: 'Invalid hash or address' });
        }
    };

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <h1>Ionova Explorer</h1>
                <div className="network-toggle">
                    <button
                        className={`toggle-btn ${network === 'mainnet' ? 'active' : ''}`}
                        onClick={() => setNetwork('mainnet')}
                    >
                        Mainnet
                    </button>
                    <button
                        className={`toggle-btn ${network === 'testnet' ? 'active' : ''}`}
                        onClick={() => setNetwork('testnet')}
                    >
                        Testnet
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search by Address / Tx Hash / Block / Token"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">🔍</button>
                </form>
            </div>

            {/* Search Results */}
            {searchResult && (
                <div className="search-result-card">
                    <div className="result-header">
                        <h3>Search Result</h3>
                        <button onClick={() => setSearchResult(null)} className="close-btn">×</button>
                    </div>
                    <div className="result-content">
                        {searchResult.type === 'transaction' && (
                            <div className="tx-details">
                                <h4>Transaction Details</h4>
                                <div className="detail-row"><span className="label">Hash:</span> <span className="mono">{searchResult.id}</span></div>
                                <div className="detail-row"><span className="label">Status:</span> <span className="badge success">Success</span></div>
                                <div className="detail-row"><span className="label">Block:</span> <span className="link">#1234567</span></div>
                                <div className="detail-row"><span className="label">From:</span> <span className="mono">0x123...abc</span></div>
                                <div className="detail-row"><span className="label">To:</span> <span className="mono">0x456...def</span></div>
                                <div className="detail-row"><span className="label">Value:</span> <span>150 IONX</span></div>
                            </div>
                        )}
                        {searchResult.type === 'address' && (
                            <div className="address-details">
                                <h4>Address Details</h4>
                                <div className="detail-row"><span className="label">Address:</span> <span className="mono">{searchResult.id}</span></div>
                                <div className="detail-row"><span className="label">Balance:</span> <span>2,450.50 IONX</span></div>
                                <div className="detail-row"><span className="label">Tx Count:</span> <span>145</span></div>
                            </div>
                        )}
                        {searchResult.type === 'error' && (
                            <div className="error-msg">{searchResult.message}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Network Stats */}
            <div className="explorer-stats">
                <div className="stat-card">
                    <div className="status-indicator">
                        <div className="dot"></div>
                        <span>Online</span>
                    </div>
                    <h3>Network Status</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-value">#1234567</div>
                    <h3>Latest Block</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-value">~2,500</div>
                    <h3>TPS</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-value">128</div>
                    <h3>Active Validators</h3>
                </div>
            </div>

            <div className="explorer-grid">
                {/* Latest Blocks */}
                <div className="explorer-section">
                    <h2>📦 Latest Blocks</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Block</th>
                                    <th>Hash</th>
                                    <th>Txs</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1234567, 1234568, 1234569, 1234570].map((block) => (
                                    <tr key={block}>
                                        <td className="highlight">#{block}</td>
                                        <td>0x{Math.random().toString(16).substr(2, 10)}...</td>
                                        <td>{Math.floor(Math.random() * 100)}</td>
                                        <td>{new Date().toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Latest Transactions */}
                <div className="explorer-section">
                    <h2>💸 Latest Transactions</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Hash</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Value (IONX)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4].map((i) => (
                                    <tr key={i}>
                                        <td className="highlight">0x{Math.random().toString(16).substr(2, 8)}...</td>
                                        <td>0x{Math.random().toString(16).substr(2, 6)}...</td>
                                        <td>0x{Math.random().toString(16).substr(2, 6)}...</td>
                                        <td>{(Math.random() * 10).toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

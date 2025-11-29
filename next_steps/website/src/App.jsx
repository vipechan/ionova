import { Routes, Route } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import ValidatorSale from './pages/ValidatorSale';
import NetworkSwitcher from './components/NetworkSwitcher';
import './App.css';
import './styles/ValidatorSale.css';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Prefer injected connector (MetaMask), fallback to first available
    const connector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">
            <h1>⚡ Ionova</h1>
          </div>
          <div className="wallet-section">
            {isConnected && <NetworkSwitcher />}
            {isConnected ? (
              <div className="connected">
                <span className="address">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button onClick={() => disconnect()} className="btn btn-secondary">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} className="btn btn-primary">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ValidatorSale />} />
          <Route path="/sale" element={<ValidatorSale />} />
        </Routes>
      </main>

      <footer className="App-footer">
        <p>© 2025 Ionova Network. Built with React + Wagmi.</p>
        <div className="footer-links">
          <a href="https://docs.ionova.network" target="_blank" rel="noopener noreferrer">
            Docs
          </a>
          <a href="https://github.com/ionova" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://twitter.com/ionova" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;

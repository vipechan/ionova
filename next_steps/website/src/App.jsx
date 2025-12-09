import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import ValidatorSale from './pages/ValidatorSale';
import FaucetPage from './pages/Faucet';
import University from './pages/University';
import Explorer from './pages/Explorer';
import NetworkSwitcher from './components/NetworkSwitcher';
import Airdrop from './pages/Airdrop';
import Developer from './pages/Developer';
import './App.css';
import './styles/ValidatorSale.css';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const location = useLocation();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
          <Link to="/" className="logo-link">
            <div className="logo">
              <h1>⚡ Ionova</h1>
            </div>
          </Link>

          <nav className="main-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/sale" className={location.pathname === '/sale' ? 'active' : ''}>Sale</Link>
            <Link to="/university" className={location.pathname === '/university' ? 'active' : ''}>University</Link>
            <Link to="/faucet" className={location.pathname === '/faucet' ? 'active' : ''}>Faucet</Link>
            <Link to="/explorer" className={location.pathname === '/explorer' ? 'active' : ''}>Explorer</Link>
            <Link to="/airdrop" className={location.pathname === '/airdrop' ? 'active' : ''}>Airdrop</Link>
            <Link to="/developer" className={location.pathname === '/developer' ? 'active' : ''}>Devs</Link>
          </nav>

          <div className="wallet-section">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
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
          <Route path="/" element={<Home />} />
          <Route path="/sale" element={<ValidatorSale />} />
          <Route path="/faucet" element={<FaucetPage />} />
          <Route path="/university" element={<University />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/airdrop" element={<Airdrop />} />
          <Route path="/developer" element={<Developer />} />
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

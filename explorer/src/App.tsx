import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import Transactions from './pages/Transactions';
import './App.css';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className="app">
                    <nav className="navbar">
                        <div className="nav-container">
                            <Link to="/" className="logo">
                                <span className="logo-icon">🔐</span>
                                <span className="logo-text">Ionova Explorer</span>
                                <span className="quantum-badge">Quantum-Safe</span>
                            </Link>

                            <div className="nav-links">
                                <Link to="/" className="nav-link">Dashboard</Link>
                                <Link to="/blocks" className="nav-link">Blocks</Link>
                                <Link to="/transactions" className="nav-link">Transactions</Link>
                            </div>
                        </div>
                    </nav>

                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/blocks" element={<Blocks />} />
                            <Route path="/transactions" element={<Transactions />} />
                        </Routes>
                    </main>

                    <footer className="footer">
                        <p>Ionova Blockchain Explorer • Quantum-Safe • 500K TPS</p>
                    </footer>
                </div>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;

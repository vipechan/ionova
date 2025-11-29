import { useState, useEffect } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import './WalletConnect.css';

/**
 * Multi-wallet connector component
 * Supports MetaMask, WalletConnect, and Coinbase Wallet
 */
function WalletConnect({ onConnect }) {
    const [showModal, setShowModal] = useState(false);
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { connect, connectors, error, isPending } = useConnect();

    // Handle connection success
    useEffect(() => {
        if (isConnected && showModal) {
            setShowModal(false);
            if (onConnect) onConnect();
        }
    }, [isConnected, showModal, onConnect]);

    const handleConnect = (connector) => {
        connect({ connector });
    };

    const handleDisconnect = () => {
        disconnect();
        setShowModal(false);
    };

    // Helper to get icon for connector
    const getConnectorIcon = (connector) => {
        if (connector.name.toLowerCase().includes('metamask')) return '🦊';
        if (connector.name.toLowerCase().includes('walletconnect')) return '📱';
        if (connector.name.toLowerCase().includes('coinbase')) return '🔵';
        if (connector.name.toLowerCase().includes('injected')) return '💉';
        return '🔌';
    };

    if (isConnected) {
        return (
            <div className="wallet-connected">
                <div className="wallet-address">
                    <span className="address-label">Connected:</span>
                    <span className="address-value">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                </div>
                <button onClick={handleDisconnect} className="btn btn-disconnect">
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <>
            <button onClick={() => setShowModal(true)} className="btn btn-connect">
                Connect Wallet
            </button>

            {showModal && (
                <div className="wallet-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Connect Wallet</h2>
                            <button onClick={() => setShowModal(false)} className="close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">
                                Choose your preferred wallet to connect to Ionova
                            </p>

                            <div className="wallet-options">
                                {connectors.map((connector) => (
                                    <button
                                        key={connector.uid}
                                        onClick={() => handleConnect(connector)}
                                        className="wallet-option"
                                        disabled={isPending}
                                    >
                                        <div className="wallet-icon">{getConnectorIcon(connector)}</div>
                                        <div className="wallet-info">
                                            <div className="wallet-name">{connector.name}</div>
                                            <div className="wallet-description">Connect with {connector.name}</div>
                                        </div>
                                        {isPending && (
                                            <div className="wallet-loading">
                                                <div className="spinner"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    <span>{error.message}</span>
                                </div>
                            )}

                            <div className="modal-footer">
                                <p className="wallet-note">
                                    By connecting a wallet, you agree to Ionova's Terms of Service
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default WalletConnect;

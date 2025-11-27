import { useState } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import './WalletConnect.css';

/**
 * Multi-wallet connector component
 * Supports MetaMask, WalletConnect, and Coinbase Wallet
 */
function WalletConnect({ onConnect }) {
    const [showModal, setShowModal] = useState(false);
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { connect, connectors, error, isLoading, pendingConnector } = useConnect({
        onSuccess: () => {
            setShowModal(false);
            if (onConnect) onConnect();
        },
    });

    const walletOptions = [
        {
            id: 'metamask',
            name: 'MetaMask',
            icon: '🦊',
            description: 'Connect with MetaMask browser extension',
            connector: new InjectedConnector(),
        },
        {
            id: 'walletconnect',
            name: 'WalletConnect',
            icon: '📱',
            description: 'Scan QR code with your mobile wallet',
            connector: new WalletConnectConnector({
                options: {
                    projectId: 'YOUR_PROJECT_ID', // Replace with actual WalletConnect project ID
                    showQrModal: true,
                },
            }),
        },
        {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            icon: '🔵',
            description: 'Connect with Coinbase Wallet',
            connector: new CoinbaseWalletConnector({
                options: {
                    appName: 'Ionova',
                },
            }),
        },
    ];

    const handleConnect = (connector) => {
        connect({ connector });
    };

    const handleDisconnect = () => {
        disconnect();
        setShowModal(false);
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
                                {walletOptions.map((wallet) => (
                                    <button
                                        key={wallet.id}
                                        onClick={() => handleConnect(wallet.connector)}
                                        className="wallet-option"
                                        disabled={isLoading && pendingConnector?.id === wallet.connector.id}
                                    >
                                        <div className="wallet-icon">{wallet.icon}</div>
                                        <div className="wallet-info">
                                            <div className="wallet-name">{wallet.name}</div>
                                            <div className="wallet-description">{wallet.description}</div>
                                        </div>
                                        {isLoading && pendingConnector?.id === wallet.connector.id && (
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

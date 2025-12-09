import React, { useState } from 'react';
import { IonovaWallet, SignatureType } from '@ionova/wallet-sdk';
import { useWallet, useSignatureTypes } from '@ionova/wallet-sdk/react';
import './WalletConnect.css';

/**
 * Wallet connection component with quantum-safe signature selection
 */
export function WalletConnect() {
    const {
        wallet,
        address,
        balance,
        signatureType,
        isConnected,
        isLoading,
        error,
        connect,
        disconnect,
    } = useWallet();

    const signatureTypes = useSignatureTypes();
    const [selectedType, setSelectedType] = useState<SignatureType>(SignatureType.Dilithium);

    const handleConnect = async () => {
        let newWallet: IonovaWallet;

        switch (selectedType) {
            case SignatureType.ECDSA:
                newWallet = IonovaWallet.createECDSA();
                break;
            case SignatureType.Dilithium:
                newWallet = IonovaWallet.createDilithium();
                break;
            case SignatureType.Hybrid:
                newWallet = IonovaWallet.createHybrid();
                break;
            default:
                newWallet = IonovaWallet.createDilithium();
        }

        await connect(newWallet);
    };

    if (isConnected && wallet) {
        return (
            <div className="wallet-connected">
                <div className="wallet-header">
                    <div className="wallet-badge">
                        {signatureType === SignatureType.Dilithium && <span className="quantum-badge">🔐 Quantum-Safe</span>}
                        {signatureType === SignatureType.Hybrid && <span className="quantum-badge">🛡️ Maximum Security</span>}
                        {signatureType === SignatureType.ECDSA && <span className="legacy-badge">⚠️ Legacy</span>}
                    </div>
                    <button onClick={disconnect} className="disconnect-btn">
                        Disconnect
                    </button>
                </div>

                <div className="wallet-info">
                    <div className="info-row">
                        <span className="label">Address:</span>
                        <span className="value address">{address}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Balance:</span>
                        <span className="value">{balance || '0'} IONX</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Signature:</span>
                        <span className="value">{signatureType}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wallet-connect">
            <h2>Connect Quantum-Safe Wallet</h2>
            <p className="subtitle">Choose your signature type for maximum security</p>

            <div className="signature-types">
                {signatureTypes.map((type) => (
                    <div
                        key={type.type}
                        className={`signature-card ${selectedType === type.type ? 'selected' : ''} ${type.recommended ? 'recommended' : ''}`}
                        onClick={() => setSelectedType(type.type)}
                    >
                        {type.recommended && <div className="recommended-badge">Recommended</div>}
                        <h3>
                            {type.name}
                            {type.quantumSafe && <span className="quantum-icon">🔐</span>}
                        </h3>
                        <p className="description">{type.description}</p>
                        <div className="gas-info">
                            <span className="gas-label">Gas:</span>
                            <span className="gas-value">{type.gasEstimate.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleConnect}
                disabled={isLoading}
                className="connect-btn"
            >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>

            {error && (
                <div className="error-message">
                    Error: {error.message}
                </div>
            )}

            <div className="info-box">
                <h4>Why Quantum-Safe?</h4>
                <p>
                    Quantum computers will break traditional ECDSA signatures by 2030-2035.
                    Choose Dilithium or Hybrid for future-proof security.
                </p>
            </div>
        </div>
    );
}

/**
 * Send transaction component
 */
export function SendTransaction() {
    const { wallet, sendTransaction, isLoading } = useWallet();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [txHash, setTxHash] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet) {
            alert('Please connect wallet first');
            return;
        }

        try {
            const receipt = await sendTransaction({
                to: recipient,
                value: amount,
            });

            setTxHash(receipt.transactionHash);
            setRecipient('');
            setAmount('');
        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + (error as Error).message);
        }
    };

    if (!wallet) {
        return <div>Please connect your wallet first</div>;
    }

    return (
        <div className="send-transaction">
            <h2>Send IONX</h2>

            <form onSubmit={handleSend}>
                <div className="form-group">
                    <label>Recipient Address</label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x... or ionova1..."
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Amount (IONX)</label>
                    <input
                        type="number"
                        step="0.000001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        required
                    />
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Transaction'}
                </button>
            </form>

            {txHash && (
                <div className="success-message">
                    ✅ Transaction successful!
                    <br />
                    Hash: {txHash}
                </div>
            )}
        </div>
    );
}

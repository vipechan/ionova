/**
 * React hooks for Ionova Quantum-Safe Wallets
 */

import { useState, useCallback, useEffect } from 'react';
import { IonovaWallet, SignatureType, Transaction, SignedTransaction } from './index';

interface WalletState {
    wallet: IonovaWallet | null;
    address: string | null;
    balance: string | null;
    signatureType: SignatureType | null;
    isConnected: boolean;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Main wallet hook for React applications
 */
export function useWallet(provider?: any) {
    const [state, setState] = useState<WalletState>({
        wallet: null,
        address: null,
        balance: null,
        signatureType: null,
        isConnected: false,
        isLoading: false,
        error: null,
    });

    /**
     * Connect wallet
     */
    const connect = useCallback(async (wallet: IonovaWallet) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const balance = await wallet.getBalance();

            setState({
                wallet,
                address: wallet.address,
                balance,
                signatureType: wallet.signatureType,
                isConnected: true,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error as Error,
            }));
        }
    }, []);

    /**
     * Disconnect wallet
     */
    const disconnect = useCallback(() => {
        setState({
            wallet: null,
            address: null,
            balance: null,
            signatureType: null,
            isConnected: false,
            isLoading: false,
            error: null,
        });
    }, []);

    /**
     * Sign transaction
     */
    const signTransaction = useCallback(
        async (tx: Transaction): Promise<SignedTransaction | null> => {
            if (!state.wallet) {
                throw new Error('Wallet not connected');
            }

            setState(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                const signedTx = await state.wallet.signTransaction(tx);
                setState(prev => ({ ...prev, isLoading: false }));
                return signedTx;
            } catch (error) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error as Error,
                }));
                return null;
            }
        },
        [state.wallet]
    );

    /**
     * Send transaction
     */
    const sendTransaction = useCallback(
        async (tx: Transaction) => {
            if (!state.wallet) {
                throw new Error('Wallet not connected');
            }

            setState(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                const signedTx = await state.wallet.signTransaction(tx);
                const receipt = await state.wallet.sendTransaction(signedTx);

                // Refresh balance after transaction
                const newBalance = await state.wallet.getBalance();
                setState(prev => ({
                    ...prev,
                    balance: newBalance,
                    isLoading: false,
                }));

                return receipt;
            } catch (error) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error as Error,
                }));
                throw error;
            }
        },
        [state.wallet]
    );

    /**
     * Refresh balance
     */
    const refreshBalance = useCallback(async () => {
        if (!state.wallet) return;

        try {
            const balance = await state.wallet.getBalance();
            setState(prev => ({ ...prev, balance }));
        } catch (error) {
            setState(prev => ({ ...prev, error: error as Error }));
        }
    }, [state.wallet]);

    // Auto-refresh balance every 10 seconds
    useEffect(() => {
        if (!state.wallet) return;

        const interval = setInterval(refreshBalance, 10000);
        return () => clearInterval(interval);
    }, [state.wallet, refreshBalance]);

    return {
        // State
        wallet: state.wallet,
        address: state.address,
        balance: state.balance,
        signatureType: state.signatureType,
        isConnected: state.isConnected,
        isLoading: state.isLoading,
        error: state.error,

        // Actions
        connect,
        disconnect,
        signTransaction,
        sendTransaction,
        refreshBalance,
    };
}

/**
 * Hook for signature type selection UI
 */
export function useSignatureTypes() {
    const types = [
        {
            type: SignatureType.ECDSA,
            name: 'ECDSA',
            description: 'Traditional (MetaMask compatible)',
            gasEstimate: 24000,
            quantumSafe: false,
            recommended: false,
        },
        {
            type: SignatureType.Dilithium,
            name: 'Dilithium',
            description: 'Quantum-safe (NIST approved)',
            gasEstimate: 46000,
            quantumSafe: true,
            recommended: true,
        },
        {
            type: SignatureType.Hybrid,
            name: 'Hybrid',
            description: 'Maximum security (ECDSA + PQ)',
            gasEstimate: 28000,
            quantumSafe: true,
            recommended: true,
        },
    ];

    return types;
}

import { useState, useEffect } from 'react';
import {
    MOCK_WALLET_INFO,
    MOCK_BALANCES,
    MOCK_STAKING,
    generateMockTransactions,
    mockApiDelay,
} from '../utils/mockData';

/**
 * Mock wallet hook for demo/testing
 * Simulates wallet functionality without blockchain connection
 */
export function useMockWallet() {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Simulate wallet connection
    const connect = async () => {
        setLoading(true);
        await mockApiDelay(1000);
        setIsConnected(true);
        setAddress(MOCK_WALLET_INFO.address);
        setBalance(MOCK_BALANCES.ionx.balance);
        setTransactions(generateMockTransactions(20));
        setLoading(false);
    };

    // Simulate wallet disconnection
    const disconnect = () => {
        setIsConnected(false);
        setAddress(null);
        setBalance(0);
        setTransactions([]);
    };

    // Simulate sending transaction
    const sendTransaction = async (to, amount, memo = '') => {
        setLoading(true);
        await mockApiDelay(2000);

        const newTx = {
            id: `0x${Math.random().toString(16).substr(2, 64)}`,
            type: 'send',
            status: 'pending',
            amount,
            from: address,
            to,
            timestamp: Date.now(),
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            memo,
        };

        setTransactions(prev => [newTx, ...prev]);
        setBalance(prev => prev - parseFloat(amount));

        // Simulate confirmation after 3 seconds
        setTimeout(() => {
            setTransactions(prev =>
                prev.map(tx =>
                    tx.id === newTx.id ? { ...tx, status: 'confirmed' } : tx
                )
            );
        }, 3000);

        setLoading(false);
        return newTx;
    };

    // Simulate staking
    const stake = async (amount) => {
        setLoading(true);
        await mockApiDelay(2000);
        setBalance(prev => prev - parseFloat(amount));
        setLoading(false);
    };

    // Simulate claiming rewards
    const claimRewards = async () => {
        setLoading(true);
        await mockApiDelay(1500);
        const rewards = MOCK_STAKING.pendingRewards;
        setBalance(prev => prev + rewards);
        setLoading(false);
        return rewards;
    };

    return {
        // Connection
        isConnected,
        address,
        connect,
        disconnect,
        loading,

        // Balance
        balance,
        formattedBalance: balance.toFixed(4),
        nativeSymbol: 'IONX',

        // Chain
        chainId: 1337,
        chainName: 'Ionova',
        chainConfig: {
            name: 'Ionova',
            nativeCurrency: { symbol: 'IONX' },
            icon: '⚡',
        },
        isCorrectNetwork: true,
        isSupportedNetwork: true,

        // Transactions
        transactions,
        sendTransaction,

        // Staking
        stake,
        claimRewards,
        stakingData: MOCK_STAKING,

        // Utilities
        formatAddress: (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`,
        getExplorerLink: (hash) => `https://scan.ionova.network/tx/${hash}`,
    };
}

/**
 * Mock network hook
 * Simulates network switching
 */
export function useMockNetwork() {
    const [currentChain, setCurrentChain] = useState({
        id: 1337,
        name: 'Ionova',
        icon: '⚡',
    });

    const switchNetwork = async (chainId) => {
        await mockApiDelay(1000);

        const chains = {
            1337: { id: 1337, name: 'Ionova', icon: '⚡' },
            1: { id: 1, name: 'Ethereum', icon: '⟠' },
            56: { id: 56, name: 'BNB Chain', icon: '🔶' },
            137: { id: 137, name: 'Polygon', icon: '🟣' },
        };

        setCurrentChain(chains[chainId] || chains[1337]);
    };

    return {
        chain: currentChain,
        switchNetwork,
    };
}

export default useMockWallet;

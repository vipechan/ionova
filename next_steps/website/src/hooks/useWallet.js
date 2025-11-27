import { useState, useEffect } from 'react';
import { useAccount, useBalance, useNetwork, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';

/**
 * Enhanced wallet hook for Ionova
 * Provides wallet connection, balance tracking, network info, and transaction history
 */
export function useWallet() {
    const { address, isConnected, connector } = useAccount();
    const { chain } = useNetwork();
    const publicClient = usePublicClient();

    // Get IONX balance
    const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
        address,
        watch: true,
    });

    const [transactions, setTransactions] = useState([]);
    const [loadingTxs, setLoadingTxs] = useState(false);
    const [walletInfo, setWalletInfo] = useState(null);

    // Fetch transaction history
    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchTransactions = async () => {
            setLoadingTxs(true);
            try {
                // Get recent blocks
                const latestBlock = await publicClient.getBlockNumber();
                const fromBlock = latestBlock - 1000n; // Last ~1000 blocks

                // Get transactions for this address
                // Note: This is a simplified version. In production, use an indexer
                const txs = [];

                // You would typically use an indexer API here
                // For now, we'll just store transactions from contract interactions

                setTransactions(txs);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoadingTxs(false);
            }
        };

        fetchTransactions();
    }, [address, publicClient]);

    // Get wallet info
    useEffect(() => {
        if (!isConnected || !connector) return;

        const getWalletInfo = async () => {
            try {
                const name = await connector.name;
                setWalletInfo({
                    name,
                    address,
                    chainId: chain?.id,
                    chainName: chain?.name,
                });
            } catch (error) {
                console.error('Error getting wallet info:', error);
            }
        };

        getWalletInfo();
    }, [isConnected, connector, address, chain]);

    // Format balance for display
    const formattedBalance = balance ? formatEther(balance.value) : '0';
    const balanceNumber = parseFloat(formattedBalance);

    // Check if on correct network
    const isCorrectNetwork = chain?.id === 1; // Replace with Ionova chain ID

    // Add transaction to history (call this after sending a tx)
    const addTransaction = (tx) => {
        setTransactions(prev => [tx, ...prev]);
    };

    return {
        // Connection status
        address,
        isConnected,
        connector,
        walletInfo,

        // Balance
        balance: balanceNumber,
        formattedBalance,
        balanceLoading,
        refetchBalance,

        // Network
        chain,
        chainId: chain?.id,
        chainName: chain?.name,
        isCorrectNetwork,

        // Transactions
        transactions,
        loadingTxs,
        addTransaction,

        // Utilities
        formatAddress: (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`,
    };
}

/**
 * Hook for IONX token balance (ERC20)
 */
export function useIONXBalance(tokenAddress) {
    const { address } = useAccount();

    const { data: tokenBalance, isLoading, refetch } = useBalance({
        address,
        token: tokenAddress,
        watch: true,
    });

    const formattedBalance = tokenBalance ? formatEther(tokenBalance.value) : '0';

    return {
        balance: parseFloat(formattedBalance),
        formattedBalance,
        isLoading,
        refetch,
        symbol: tokenBalance?.symbol || 'IONX',
        decimals: tokenBalance?.decimals || 18,
    };
}

/**
 * Hook for staking information
 */
export function useStakingInfo(stakingContractAddress) {
    const { address } = useAccount();
    const [stakingData, setStakingData] = useState({
        staked: 0,
        rewards: 0,
        apr: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address || !stakingContractAddress) return;

        const fetchStakingData = async () => {
            setLoading(true);
            try {
                // TODO: Implement actual contract calls
                // This is a placeholder
                setStakingData({
                    staked: 0,
                    rewards: 0,
                    apr: 250, // 250% APR in Year 1-2
                });
            } catch (error) {
                console.error('Error fetching staking data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStakingData();
    }, [address, stakingContractAddress]);

    return {
        ...stakingData,
        loading,
    };
}

export default useWallet;

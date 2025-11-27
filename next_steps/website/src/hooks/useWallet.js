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

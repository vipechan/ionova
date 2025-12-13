import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import validatorFractionNFTAbi from '../contracts/ValidatorFractionNFT.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

export function useValidatorSale() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [stats, setStats] = useState(null);

    // Read: Current Price
    const { data: currentPrice } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getCurrentPrice',
    });

    // Read: Sale Stats
    const { data: saleStats, refetch: refetchStats } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getSaleStats',
    });

    // Read: User Fractions Owned
    const { data: userFractions } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getTotalFractionsOwned',
        args: [address],
        query: {
            enabled: !!address,
        },
    });

    // Read: User Ownership Percentage
    const { data: ownershipPercentage } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getOwnershipPercentage',
        args: [address],
        query: {
            enabled: !!address,
        },
    });

    // Read: Pending Rewards
    const { data: pendingRewards } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getPendingRewards',
        args: [address],
        query: {
            enabled: !!address,
        },
    });

    // Read: KYC Status
    const { data: kycVerified } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'kycVerified',
        args: [address],
        query: {
            enabled: !!address,
        },
    });

    // Read: Total Cost for quantity (using useReadContract directly isn't ideal for async calls on demand, 
    // but for v2 we usually use useReadContract with enabled: false or just rely on publicClient.readContract if we need imperative)
    // For simplicity in migration, we can keep using useReadContract but we can't easily make it imperative like before without publicClient.
    // However, the previous code was using useContractRead imperatively which is weird. 
    // Let's assume we can just use the public client for this or just skip it for now and let the UI handle it via state.
    // Actually, let's use the public client pattern if needed, but for now let's just expose a hook that reacts to quantity changes if we were to pass it.
    // But the original code had `getTotalCost` as an async function.
    // In Wagmi v2, we can use `usePublicClient` to get the client and call readContract.

    // We need to import usePublicClient
    // But wait, I can't change imports easily in the replacement chunk without seeing the top. 
    // I am replacing the whole file so I can add imports.

    // Write: Buy Fractions
    const {
        data: buyData,
        writeContract: buyFractionsWrite,
        isPending: isBuying,
        isError: buyError
    } = useWriteContract();

    const buyFractions = (args) => {
        buyFractionsWrite({
            address: CONTRACT_ADDRESS,
            abi: validatorFractionNFTAbi,
            functionName: 'buyFractions',
            args: args?.args || [], // Adapt to how it was called
        });
    };

    const { isLoading: isWaitingForBuy, isSuccess: buySuccess } = useWaitForTransactionReceipt({
        hash: buyData,
    });

    // Write: Claim Rewards
    const {
        data: claimData,
        writeContract: claimRewardsWrite,
        isPending: isClaiming,
        isError: claimError
    } = useWriteContract();

    const claimRewards = () => {
        claimRewardsWrite({
            address: CONTRACT_ADDRESS,
            abi: validatorFractionNFTAbi,
            functionName: 'claimRewards',
        });
    };

    const { isLoading: isWaitingForClaim, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
        hash: claimData,
    });

    // Format sale stats
    useEffect(() => {
        if (saleStats) {
            const [sold, remaining, price, raised, percentSold] = saleStats;
            setStats({
                fractionsSold: Number(sold),
                fractionsRemaining: Number(remaining),
                currentPrice: formatUnits(price, 6),
                totalRaised: formatUnits(raised, 6),
                percentSold: Number(percentSold),
            });
        }
    }, [saleStats]);

    // Get total cost for a quantity (imperative call)
    const getTotalCost = async (quantity) => {
        if (!publicClient || !CONTRACT_ADDRESS) return 0n;
        try {
            const cost = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: validatorFractionNFTAbi,
                functionName: 'getTotalCost',
                args: [BigInt(quantity)],
            });
            return cost;
        } catch (error) {
            console.error('Error getting total cost:', error);
            return 0n;
        }
    };

    // Calculate rewards and ROI for given quantity
    // Per fraction over 15 years: 3750 IONX total
    // 
    // Emission follows annual halving:
    // Year 1: 50% of total = 1875 IONX
    // Year 2: 25% of total = 937.5 IONX
    // Year 3: 12.5% of total = 468.75 IONX
    // ... continues with halving until Year 15
    const calculateROI = (quantity, cost) => {
        // Total vested rewards per fraction over entire 15-year period
        const totalLifetimeRewardsPerFraction = 3750; // IONX per fraction (entire 15 years)

        // Year 1 is highest due to emission curve (50% of total released in Year 1)
        const year1RewardsPerFraction = totalLifetimeRewardsPerFraction * 0.5; // 376.2 IONX

        // Total Year 1 rewards for quantity
        const totalYear1Rewards = quantity * year1RewardsPerFraction;
        const costUSD = parseFloat(formatUnits(cost || 0n, 6));

        if (costUSD === 0) return 0;

        // Calculate Year 1 ROI (assuming $1/IONX)
        const roi = ((totalYear1Rewards - costUSD) / costUSD) * 100;
        return roi;
    };

    return {
        // Contract address
        contractAddress: CONTRACT_ADDRESS,

        // Read data
        currentPrice: currentPrice ? formatUnits(currentPrice, 6) : '0',
        stats,
        userFractions: userFractions ? Number(userFractions) : 0,
        ownershipPercentage: ownershipPercentage ? Number(ownershipPercentage) / 1000000 : 0,
        pendingRewards: pendingRewards ? formatUnits(pendingRewards, 18) : '0',
        kycVerified: kycVerified || false,

        // Write functions
        buyFractions: (config) => buyFractionsWrite({
            address: CONTRACT_ADDRESS,
            abi: validatorFractionNFTAbi,
            functionName: 'buyFractions',
            args: config?.args || [],
        }),
        claimRewards,

        // Loading states
        isBuying: isBuying || isWaitingForBuy,
        isClaiming: isClaiming || isWaitingForClaim,

        // Success states
        buySuccess,
        claimSuccess,

        // Error states
        buyError,
        claimError,

        // Helper functions
        getTotalCost,
        calculateROI,
        refetchStats,
    };
}

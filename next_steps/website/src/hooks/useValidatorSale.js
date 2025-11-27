import { useState, useEffect } from 'react';
import { useContractRead, useContractWrite, useWaitForTransaction, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import validatorFractionNFTAbi from '../contracts/ValidatorFractionNFT.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

export function useValidatorSale() {
    const { address } = useAccount();
    const [stats, setStats] = useState(null);

    // Read: Current Price
    const { data: currentPrice } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getCurrentPrice',
        watch: true,
    });

    // Read: Sale Stats
    const { data: saleStats, refetch: refetchStats } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getSaleStats',
        watch: true,
    });

    // Read: User Fractions Owned
    const { data: userFractions } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getTotalFractionsOwned',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: User Ownership Percentage
    const { data: ownershipPercentage } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getOwnershipPercentage',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: Pending Rewards
    const { data: pendingRewards } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getPendingRewards',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: KYC Status
    const { data: kycVerified } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'kycVerified',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: Total Cost for quantity
    const getTotalCost = async (quantity) => {
        try {
            const { data } = await useContractRead({
                address: CONTRACT_ADDRESS,
                abi: validatorFractionNFTAbi,
                functionName: 'getTotalCost',
                args: [BigInt(quantity)],
            });
            return data;
        } catch (error) {
            console.error('Error getting total cost:', error);
            return null;
        }
    };

    // Write: Buy Fractions
    const {
        data: buyData,
        write: buyFractions,
        isLoading: isBuying,
        isError: buyError,
    } = useContractWrite({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'buyFractions',
    });

    const { isLoading: isWaitingForBuy, isSuccess: buySuccess } = useWaitForTransaction({
        hash: buyData?.hash,
    });

    // Write: Claim Rewards
    const {
        data: claimData,
        write: claimRewards,
        isLoading: isClaiming,
        isError: claimError,
    } = useContractWrite({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'claimRewards',
    });

    const { isLoading: isWaitingForClaim, isSuccess: claimSuccess } = useWaitForTransaction({
        hash: claimData?.hash,
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

    // Calculate ROI for given quantity
    const calculateROI = (quantity, cost) => {
        const annualRewardPerFraction = 970 * 365; // 970 IONX/day * 365 days
        const totalAnnualRewards = quantity * annualRewardPerFraction;
        const costUSD = parseFloat(formatUnits(cost || 0n, 6));

        if (costUSD === 0) return 0;

        // Assuming IONX = $1 for calculation
        const roi = ((totalAnnualRewards - costUSD) / costUSD) * 100;
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
        buyFractions,
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

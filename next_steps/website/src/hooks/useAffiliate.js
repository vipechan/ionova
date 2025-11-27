import { useContractRead, useContractWrite, useWaitForTransaction, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import validatorFractionNFTAbi from '../contracts/ValidatorFractionNFT.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export function useAffiliate() {
    const { address } = useAccount();

    // Read: Affiliate Stats
    const { data: affiliateStats, refetch: refetchStats } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getAffiliateStats',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: Next Rank Requirements
    const { data: nextRankData } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getNextRankRequirements',
        args: [address],
        enabled: !!address,
        watch: true,
    });

    // Read: My Referrer
    const { data: myReferrer } = useContractRead({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'getMyReferrer',
        enabled: !!address,
        watch: true,
    });

    // Write: Claim Commission
    const {
        data: claimData,
        write: claimCommission,
        isLoading: isClaiming,
        isError: claimError,
    } = useContractWrite({
        address: CONTRACT_ADDRESS,
        abi: validatorFractionNFTAbi,
        functionName: 'claimCommission',
    });

    const { isLoading: isWaitingForClaim, isSuccess: claimSuccess } = useWaitForTransaction({
        hash: claimData?.hash,
    });

    // Format stats
    const stats = affiliateStats ? {
        rank: Number(affiliateStats[0]),
        pendingCommission: formatUnits(affiliateStats[1], 6),
        totalEarned: formatUnits(affiliateStats[2], 6),
        selfSalesTotal: formatUnits(affiliateStats[3], 6),
        downlineSalesTotal: formatUnits(affiliateStats[4], 6),
        commissionRate: Number(affiliateStats[5]),
    } : null;

    const nextRankReqs = nextRankData ? {
        nextRank: Number(nextRankData[0]),
        downlineNeeded: formatUnits(nextRankData[1], 6),
        selfNeeded: formatUnits(nextRankData[2], 6),
    } : { nextRank: 0, downlineNeeded: 0, selfNeeded: 0 };

    // Get rank name
    const getRankName = (rankNumber) => {
        const ranks = ['Starter', 'Bronze', 'Silver', 'Gold'];
        return ranks[rankNumber] || 'Starter';
    };

    return {
        // Contract address
        contractAddress: CONTRACT_ADDRESS,

        // Read data
        stats,
        rankName: stats ? getRankName(stats.rank) : 'Starter',
        nextRankReqs,
        myReferrer: myReferrer || null,

        // Write functions
        claimCommission,

        // Loading states
        isClaiming: isClaiming || isWaitingForClaim,

        // Success states
        claimSuccess,

        // Error states
        claimError,

        // Helper functions
        refetchStats,
    };
}

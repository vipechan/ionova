// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IONXToken.sol";
import "./ValidatorFractionNFT.sol";

/**
 * @title ValidatorRewardDistributor
 * @notice Daily reward distribution with emission-curve vesting
 * @dev Vesting releases follow the same emission curve (halving annually)
 * 
 * Model:
 * - 50% immediately claimable
 * - 50% vests over 15 years using emission curve
 * - Year 1: 50% of vesting released
 * - Year 2: 25% of vesting released (halved)
 * - Year 15: Final remainder, total = 100%
 */
contract ValidatorRewardDistributor is Ownable, ReentrancyGuard {
    
    IONXToken public ionxToken;
    ValidatorFractionNFT public validatorNFT;
    
    uint256 public constant TOTAL_YEARS = 15;
    uint256 public constant DAYS_PER_YEAR = 365;
    uint256 public immutable genesisTimestamp;
    
    struct VestingBatch {
        uint256 amount;
        uint256 dayAdded;
        uint256 released;
    }
    
    struct UserBalance {
        uint256 claimableBalance;
        uint256 totalEarned;
        uint256 totalClaimed;
        VestingBatch[] vestingBatches;
    }
    
    mapping(address => UserBalance) public userBalances;
    
    uint256 public totalDistributed;
    uint256 public totalClaimed;
    uint256 public lastDistributionDay;
    
    address[] public holders;
    mapping(address => bool) public isHolder;
    
    event RewardsCredited(address indexed user, uint256 claimable, uint256 vesting, uint256 day);
    event VestingReleased(address indexed user, uint256 amount, uint256 day);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _ionxToken, address _validatorNFT) {
        ionxToken = IONXToken(_ionxToken);
        validatorNFT = ValidatorFractionNFT(_validatorNFT);
        genesisTimestamp = block.timestamp;
        lastDistributionDay = 0;
    }
    
    function getCurrentDay() public view returns (uint256) {
        return ((block.timestamp - genesisTimestamp) / 1 days) + 1;
    }
    
    function distributeDaily() external nonReentrant {
        uint256 currentDay = getCurrentDay();
        require(currentDay > lastDistributionDay, "Already distributed");
        require(currentDay <= TOTAL_YEARS * DAYS_PER_YEAR, "Distribution ended");
        
        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            uint256 fractions = validatorNFT.totalFractionsOwned(holder);
            
            if (fractions > 0) {
                uint256 dailyEmission = validatorNFT.getCurrentDailyEmission();
                uint256 totalFractions = validatorNFT.getTotalActiveFractions();
                uint256 userReward = (dailyEmission * fractions) / totalFractions;
                
                uint256 claimable = userReward / 2;
                uint256 vesting = userReward / 2;
                
                UserBalance storage balance = userBalances[holder];
                balance.claimableBalance += claimable;
                balance.totalEarned += userReward;
                
                balance.vestingBatches.push(VestingBatch({
                    amount: vesting,
                    dayAdded: currentDay,
                    released: 0
                }));
                
                uint256 released = _releaseVested(holder, currentDay);
                
                emit RewardsCredited(holder, claimable, vesting, currentDay);
                if (released > 0) emit VestingReleased(holder, released, currentDay);
            }
        }
        
        lastDistributionDay = currentDay;
    }
    
    function _releaseVested(address user, uint256 currentDay) internal returns (uint256) {
        UserBalance storage balance = userBalances[user];
        uint256 totalReleased = 0;
        
        for (uint256 i = 0; i < balance.vestingBatches.length; i++) {
            VestingBatch storage batch = balance.vestingBatches[i];
            uint256 daysElapsed = currentDay - batch.dayAdded;
            
            // Calculate release using emission curve
            uint256 releasable = _calculateEmissionCurveRelease(
                batch.amount, 
                daysElapsed
            );
            
            uint256 newRelease = releasable - batch.released;
            if (newRelease > 0) {
                batch.released += newRelease;
                totalReleased += newRelease;
            }
        }
        
        if (totalReleased > 0) {
            balance.claimableBalance += totalReleased;
        }
        
        return totalReleased;
    }
    
    function _calculateEmissionCurveRelease(
        uint256 totalAmount,
        uint256 daysElapsed
    ) internal pure returns (uint256) {
        uint256 released = 0;
        
        for (uint256 year = 0; year < TOTAL_YEARS; year++) {
            uint256 yearStart = year * DAYS_PER_YEAR;
            uint256 yearEnd = (year + 1) * DAYS_PER_YEAR;
            
            if (daysElapsed < yearStart) break;
            
            // Each year releases half of previous year (emission curve)
            uint256 yearPortion = totalAmount / (2 ** (year + 1));
            
            if (daysElapsed >= yearEnd) {
                released += yearPortion;
            } else {
                uint256 daysInYear = daysElapsed - yearStart;
                released += (yearPortion * daysInYear) / DAYS_PER_YEAR;
                break;
            }
        }
        
        return released;
    }
    
    function claimRewards() external nonReentrant {
        UserBalance storage balance = userBalances[msg.sender];
        uint256 claimable = balance.claimableBalance;
        require(claimable > 0, "No rewards");
        
        balance.claimableBalance = 0;
        balance.totalClaimed += claimable;
        totalClaimed += claimable;
        
        ionxToken.transfer(msg.sender, claimable);
        emit RewardsClaimed(msg.sender, claimable);
    }
    
    function addHolder(address holder) external {
        require(msg.sender == address(validatorNFT), "Only ValidatorNFT");
        if (!isHolder[holder]) {
            holders.push(holder);
            isHolder[holder] = true;
        }
    }
    
    function getUserBalance(address user) external view returns (
        uint256 claimable,
        uint256 vesting,
        uint256 totalEarned,
        uint256 totalClaimed
    ) {
        UserBalance storage balance = userBalances[user];
        return (
            balance.claimableBalance,
            getUnreleasedVesting(user),
            balance.totalEarned,
            balance.totalClaimed
        );
    }
    
    function getUnreleasedVesting(address user) public view returns (uint256) {
        UserBalance storage balance = userBalances[user];
        uint256 total = 0;
        
        for (uint256 i = 0; i < balance.vestingBatches.length; i++) {
            total += balance.vestingBatches[i].amount - balance.vestingBatches[i].released;
        }
        
        return total;
    }
}

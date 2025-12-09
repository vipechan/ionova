// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title IONX Governance Token
 * @notice Complete implementation of Ionova's native token with:
 *         - Bitcoin-style halving emission
 *         - Distribution to validator holders
 *         - Staking rewards
 *         - Governance rights
 *         - Burn mechanisms
 *         - Vesting schedules
 * @dev Upgradeable via UUPS proxy pattern
 */
contract IONXToken is 
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    
    // ============ CONSTANTS ============
    
    /// @notice Maximum total supply (10 billion IONX)
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;
    
    /// @notice Initial daily emission (1 million IONX/day)
    uint256 public constant INITIAL_DAILY_EMISSION = 1_000_000 * 10**18;
    
    /// @notice Halving interval (730 days = 2 years)
    uint256 public constant HALVING_INTERVAL = 730 days;
    
    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BP_DENOMINATOR = 10000;
    
    // ============ TOKENOMICS DISTRIBUTION ============
    
    /// @notice Distribution percentages (in basis points)
    struct TokenomicsDistribution {
        uint256 validatorRewards;      // 70% of emission
        uint256 stakingRewards;        // 20% of emission
        uint256 ecosystemFund;         // 10% of emission
        uint256 publicSale;            // 40% of max supply
        uint256 treasury;              // 20% of max supply
        uint256 development;           // 15% of max supply
        uint256 marketing;             // 5% of max supply
        uint256 team;                  // 5% of max supply
    }
    
    TokenomicsDistribution public distribution;
    
    // ============ EMISSION STATE ============
    
    /// @notice Timestamp when emission started
    uint256 public emissionStartTime;
    
    /// @notice Last emission timestamp
    uint256 public lastEmissionTime;
    
    /// @notice Current emission epoch
    uint256 public currentEpoch;
    
    /// @notice Total emitted so far
    uint256 public totalEmitted;
    
    /// @notice Accumulated validator rewards pending distribution
    uint256 public pendingValidatorRewards;
    
    /// @notice Accumulated staking rewards pending distribution
    uint256 public pendingStakingRewards;
    
    /// @notice Accumulated ecosystem fund
    uint256 public ecosystemFund;
    
    // ============ ADDRESSES ============
    
    /// @notice Validator NFT contract (receives rewards)
    address public validatorContract;
    
    /// @notice Staking contract (receives rewards)
    address public stakingContract;
    
    /// @notice Treasury multi-sig
    address public treasury;
    
    /// @notice Development fund
    address public developmentFund;
    
    /// @notice Marketing fund
    address public marketingFund;
    
    /// @notice Team wallet
    address public teamWallet;
    
    // ============ VESTING ============
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // ============ STATISTICS ============
    
    /// @notice Total burned
    uint256 public totalBurned;
    
    /// @notice Total distributed to validators
    uint256 public totalValidatorRewards;
    
    /// @notice Total distributed to stakers
    uint256 public totalStakingRewards;
    
    /// @notice Transaction count
    uint256 public transactionCount;
    
    // ============ EVENTS ============
    
    event EmissionTriggered(uint256 epoch, uint256 amount, uint256 timestamp);
    event ValidatorRewardsDistributed(uint256 amount, uint256 timestamp);
    event ValidatorRewardsRedirected(uint256 amount, string reason);
    event StakingRewardsDistributed(uint256 amount, uint256 timestamp);
    event EcosystemFundAllocated(uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed burner, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event VestingReleased(address indexed beneficiary, uint256 amount);
    event HalvingOccurred(uint256 newEpoch, uint256 newDailyEmission);
    
    // ============ MODIFIERS ============
    
    modifier onlyValidator() {
        require(msg.sender == validatorContract, "Only validator contract");
        _;
    }
    
    modifier onlyStaking() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }
    
    // ============ INITIALIZATION ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _treasury,
        address _developmentFund,
        address _marketingFund,
        address _teamWallet
    ) public initializer {
        __ERC20_init("Ionova Token", "IONX");
        __ERC20Burnable_init();
        __ERC20Votes_init();
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        // Set addresses
        treasury = _treasury;
        developmentFund = _developmentFund;
        marketingFund = _marketingFund;
        teamWallet = _teamWallet;
        
        // Initialize distribution percentages
        distribution = TokenomicsDistribution({
            validatorRewards: 7000,   // 70%
            stakingRewards: 2000,     // 20%
            ecosystemFund: 1000,      // 10%
            publicSale: 4000,         // 40%
            treasury: 2000,           // 20%
            development: 1500,        // 15%
            marketing: 500,           // 5%
            team: 500                 // 5%
        });
        
        // Initialize emission
        emissionStartTime = block.timestamp;
        lastEmissionTime = block.timestamp;
        currentEpoch = 0;
        
        // Mint initial allocations
        _mintInitialAllocations();
    }
    
    // ============ INITIAL ALLOCATION ============
    
    function _mintInitialAllocations() internal {
        // Calculate initial allocations from MAX_SUPPLY
        uint256 treasuryAmount = (MAX_SUPPLY * distribution.treasury) / BP_DENOMINATOR;
        uint256 devAmount = (MAX_SUPPLY * distribution.development) / BP_DENOMINATOR;
        uint256 marketingAmount = (MAX_SUPPLY * distribution.marketing) / BP_DENOMINATOR;
        uint256 teamAmount = (MAX_SUPPLY * distribution.team) / BP_DENOMINATOR;
        
        // Mint to treasury (immediately available)
        _mint(treasury, treasuryAmount);
        
        // Create vesting schedules
        _createVestingSchedule(developmentFund, devAmount, 4 * 365 days, 0); // 4 year vest
        _createVestingSchedule(marketingFund, marketingAmount, 2 * 365 days, 0); // 2 year vest
        _createVestingSchedule(teamWallet, teamAmount, 4 * 365 days, 365 days); // 4 year vest, 1 year cliff
        
        totalEmitted += treasuryAmount; // Count initial mints
    }
    
    // ============ EMISSION MECHANISM ============
    
    /**
     * @notice Calculate current daily emission based on halvings
     * @return Current daily emission amount
     */
    function getCurrentDailyEmission() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - emissionStartTime;
        uint256 epochsPassed = timeElapsed / HALVING_INTERVAL;
        
        // Calculate emission with halvings: initial / (2^epochs)
        uint256 dailyEmission = INITIAL_DAILY_EMISSION;
        for (uint256 i = 0; i < epochsPassed; i++) {
            dailyEmission = dailyEmission / 2;
        }
        
        return dailyEmission;
    }
    
    /**
     * @notice Calculate pending emission since last distribution
     * @return Amount to emit
     */
    function calculatePendingEmission() public view returns (uint256) {
        if (totalSupply() >= MAX_SUPPLY) {
            return 0;
        }
        
        uint256 timeSinceLastEmission = block.timestamp - lastEmissionTime;
        uint256 daysPassed = timeSinceLastEmission / 1 days;
        
        if (daysPassed == 0) {
            return 0;
        }
        
        uint256 dailyEmission = getCurrentDailyEmission();
        uint256 toEmit = dailyEmission * daysPassed;
        
        // Ensure we don't exceed max supply
        if (totalSupply() + toEmit > MAX_SUPPLY) {
            toEmit = MAX_SUPPLY - totalSupply();
        }
        
        return toEmit;
    }
    
    /**
     * @notice Trigger daily emission (can be called by anyone)
     */
    function triggerEmission() external whenNotPaused {
        uint256 toEmit = calculatePendingEmission();
        require(toEmit > 0, "No emission pending");
        
        // Check if halving occurred
        uint256 newEpoch = (block.timestamp - emissionStartTime) / HALVING_INTERVAL;
        if (newEpoch > currentEpoch) {
            currentEpoch = newEpoch;
            emit HalvingOccurred(currentEpoch, getCurrentDailyEmission());
        }
        
        // Calculate distribution
        uint256 validatorAmount = (toEmit * distribution.validatorRewards) / BP_DENOMINATOR;
        uint256 stakingAmount = (toEmit * distribution.stakingRewards) / BP_DENOMINATOR;
        uint256 ecosystemAmount = toEmit - validatorAmount - stakingAmount;
        
        // Allocate to pending pools
        pendingValidatorRewards += validatorAmount;
        pendingStakingRewards += stakingAmount;
        ecosystemFund += ecosystemAmount;
        
        // Update state
        totalEmitted += toEmit;
        lastEmissionTime = block.timestamp;
        
        emit EmissionTriggered(currentEpoch, toEmit, block.timestamp);
    }
    
    // ============ REWARD DISTRIBUTION ============
    
    /**
     * @notice Distribute validator rewards (called by validator contract)
     * @param recipients Array of validator holders
     * @param amounts Array of reward amounts
     * @dev If no recipients (zero fraction holders), rewards go to ecosystem fund
     */
    function distributeValidatorRewards(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyValidator whenNotPaused {
        require(recipients.length == amounts.length, "Length mismatch");
        
        // EDGE CASE: No fraction holders yet
        if (recipients.length == 0) {
            // Redirect all pending validator rewards to ecosystem fund
            if (pendingValidatorRewards > 0) {
                ecosystemFund += pendingValidatorRewards;
                emit ValidatorRewardsRedirected(pendingValidatorRewards, "No holders");
                pendingValidatorRewards = 0;
            }
            return;
        }
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount <= pendingValidatorRewards, "Insufficient rewards");
        
        // Mint and distribute
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
        
        pendingValidatorRewards -= totalAmount;
        totalValidatorRewards += totalAmount;
        
        emit ValidatorRewardsDistributed(totalAmount, block.timestamp);
    }
    
    /**
     * @notice Distribute unclaimed validator rewards to treasury
     * @dev Called automatically if rewards accumulate for too long without distribution
     */
    function redistributeUnclaimedRewards() external onlyOwner {
        require(pendingValidatorRewards > 0, "No pending rewards");
        
        // Send to ecosystem fund instead of wasting
        ecosystemFund += pendingValidatorRewards;
        
        emit ValidatorRewardsRedirected(pendingValidatorRewards, "Unclaimed");
        pendingValidatorRewards = 0;
    }
    
    /**
     * @notice Distribute staking rewards (called by staking contract)
     * @param recipient Staking contract or individual staker
     * @param amount Amount to distribute
     */
    function distributeStakingRewards(
        address recipient,
        uint256 amount
    ) external onlyStaking whenNotPaused {
        require(amount <= pendingStakingRewards, "Insufficient rewards");
        
        _mint(recipient, amount);
        
        pendingStakingRewards -= amount;
        totalStakingRewards += amount;
        
        emit StakingRewardsDistributed(amount, block.timestamp);
    }
    
    /**
     * @notice Withdraw from ecosystem fund (only owner)
     * @param recipient Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawEcosystemFund(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(amount <= ecosystemFund, "Insufficient funds");
        
        ecosystemFund -= amount;
        _mint(recipient, amount);
        
        emit EcosystemFundAllocated(amount, block.timestamp);
    }
    
    // ============ VESTING ============
    
    /**
     * @notice Create vesting schedule for an address
     */
    function _createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        uint256 cliffDuration
    ) internal {
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliffDuration: cliffDuration
        });
        
        emit VestingScheduleCreated(beneficiary, amount, duration);
    }
    
    /**
     * @notice Calculate vested amount for an address
     */
    function calculateVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0) {
            return 0;
        }
        
        // Check cliff
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        // Check if fully vested
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        
        // Linear vesting
        uint256 timeVested = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeVested) / schedule.duration;
        
        return vestedAmount;
    }
    
    /**
     * @notice Release vested tokens
     */
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        
        uint256 vestedAmount = calculateVestedAmount(msg.sender);
        uint256 releasable = vestedAmount - schedule.releasedAmount;
        
        require(releasable > 0, "No tokens to release");
        
        schedule.releasedAmount += releasable;
        _mint(msg.sender, releasable);
        
        emit VestingReleased(msg.sender, releasable);
    }
    
    // ============ BURN MECHANISMS ============
    
    /**
     * @notice Burn tokens with tracking
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @notice Burn from address with tracking
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set validator contract address
     */
    function setValidatorContract(address _validator) external onlyOwner {
        require(_validator != address(0), "Invalid address");
        validatorContract = _validator;
    }
    
    /**
     * @notice Set staking contract address
     */
    function setStakingContract(address _staking) external onlyOwner {
        require(_staking != address(0), "Invalid address");
        stakingContract = _staking;
    }
    
    /**
     * @notice Update distribution addresses
     */
    function updateAddresses(
        address _treasury,
        address _dev,
        address _marketing,
        address _team
    ) external onlyOwner {
        if (_treasury != address(0)) treasury = _treasury;
        if (_dev != address(0)) developmentFund = _dev;
        if (_marketing != address(0)) marketingFund = _marketing;
        if (_team != address(0)) teamWallet = _team;
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get comprehensive statistics
     */
    function getStatistics() external view returns (
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _totalEmitted,
        uint256 _circulating,
        uint256 _currentEpoch,
        uint256 _dailyEmission,
        uint256 _pendingValidator,
        uint256 _pendingStaking,
        uint256 _ecosystem
    ) {
        return (
            totalSupply(),
            totalBurned,
            totalEmitted,
            totalSupply() - totalBurned,
            currentEpoch,
            getCurrentDailyEmission(),
            pendingValidatorRewards,
            pendingStakingRewards,
            ecosystemFund
        );
    }
    
    /**
     * @notice Get emission info
     */
    function getEmissionInfo() external view returns (
        uint256 startTime,
        uint256 lastTime,
        uint256 epoch,
        uint256 dailyEmission,
        uint256 pendingEmission,
        uint256 nextHalvingTime
    ) {
        return (
            emissionStartTime,
            lastEmissionTime,
            currentEpoch,
            getCurrentDailyEmission(),
            calculatePendingEmission(),
            emissionStartTime + ((currentEpoch + 1) * HALVING_INTERVAL)
        );
    }
    
    /**
     * @notice Calculate APY for staking (for reference)
     * @param totalStaked Total amount staked
     * @return APY in basis points
     */
    function calculateStakingAPY(uint256 totalStaked) public view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        uint256 dailyEmission = getCurrentDailyEmission();
        uint256 dailyStakingRewards = (dailyEmission * distribution.stakingRewards) / BP_DENOMINATOR;
        uint256 annualRewards = dailyStakingRewards * 365;
        
        // APY = (annualRewards / totalStaked) * 10000
        return (annualRewards * BP_DENOMINATOR) / totalStaked;
    }
    
    /**
     * @notice Estimate rewards for validator holder
     * @param fractions Number of fractions owned
     * @param totalFractions Total fractions in existence
     * @param days Number of days to calculate for
     * @return Estimated IONX rewards
     */
    function estimateValidatorRewards(
        uint256 fractions,
        uint256 totalFractions,
        uint256 days
    ) public view returns (uint256) {
        require(totalFractions > 0, "Invalid total");
        
        uint256 dailyEmission = getCurrentDailyEmission();
        uint256 dailyValidatorRewards = (dailyEmission * distribution.validatorRewards) / BP_DENOMINATOR;
        uint256 userDailyRewards = (dailyValidatorRewards * fractions) / totalFractions;
        
        return userDailyRewards * days;
    }
    
    // ============ OVERRIDES ============
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            transactionCount++;
        }
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to, amount);
    }
    
    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account, amount);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

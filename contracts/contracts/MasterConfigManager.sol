// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MasterConfigManager
 * @notice Centralized configuration for ALL Ionova contracts
 * @dev Single source of truth for all parameters - zero redeployment needed
 */
contract MasterConfigManager is AccessControl {
    
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");
    
    // ============ VALIDATOR FRACTION NFT CONFIGURATION ============
    
    struct ValidatorConfig {
        // Sale Parameters
        uint256 saleStartTime;
        uint256 saleEndTime;
        uint256 totalFractions;
        uint256 startPrice;      // In USD (6 decimals)
        uint256 endPrice;        // In USD (6 decimals)
        
        // KYC Settings
        bool kycRequired;
        uint256 kycThreshold;    // Fractions requiring KYC
        
        // Limits
        uint256 minPurchase;
        uint256 maxPurchase;
        
        // IONX Rewards
        uint256 dailyEmission;
        uint256 halvingInterval; // Days
        
        // Addresses
        address treasury;
        address ionxToken;
        address usdcToken;
        address usdtToken;
        
        // Features
        bool affiliateEnabled;
        bool rewardsEnabled;
        bool tradingEnabled;
        bool pausedState;
    }
    
    ValidatorConfig public validatorConfig;
    
    // ============ AFFILIATE COMMISSION CONFIGURATION ============
    
    struct CommissionConfig {
        uint8 activeLevels;      // 4-10
        mapping(uint8 => mapping(uint8 => uint256)) rates; // [rank][level] = rate
    }
    
    CommissionConfig public commissionConfig;
    
    // Rank requirements
    struct RankRequirement {
        uint256 minReferrals;
        uint256 minVolume;
    }
    
    mapping(uint8 => RankRequirement) public rankRequirements;
    
    // ============ STAKING CONFIGURATION ============
    
    struct StakingConfig {
        uint256 baseAPY;         // Basis points (100 = 1%)
        uint256 instantUnstakeFee; // Basis points
        uint256 delayedUnstakePeriod; // Seconds
        uint256 minStakeAmount;
        uint256 maxStakeAmount;
        bool stakingEnabled;
        bool unstakingEnabled;
        bool rewardsEnabled;
        address rewardToken;
        uint256 rewardRate;      // Per second
    }
    
    StakingConfig public stakingConfig;
    
    // ============ GOVERNANCE CONFIGURATION ============
    
    struct GovernanceConfig {
        uint256 proposalThreshold;    // Tokens needed to create proposal
        uint256 votingPeriod;          // Blocks
        uint256 quorumPercentage;      // Basis points (5000 = 50%)
        uint256 executionDelay;        // Seconds
        bool governanceActive;
        uint256 minVotingPower;
    }
    
    GovernanceConfig public governanceConfig;
    
    // ============ DAO TREASURY CONFIGURATION ============
    
    struct TreasuryConfig {
        uint256 singleTxLimit;
        uint256 dailyLimit;
        uint256 weeklyLimit;
        uint256 monthlyLimit;
        bool requiresMultiSig;
        uint8 multiSigThreshold;
        
        // Budget allocations (basis points)
        uint256 developmentAllocation;
        uint256 marketingAllocation;
        uint256 operationsAllocation;
        uint256 reserveAllocation;
    }
    
    TreasuryConfig public treasuryConfig;
    
    // ============ AIRDROP CONFIGURATION ============
    
    struct AirdropConfig {
        uint256 airdropAmount;
        uint256 airdropEndTime;
        bool airdropActive;
        bool kycRequired;
        uint256 maxClaimsPerUser;
    }
    
    AirdropConfig public airdropConfig;
    
    // ============ FEE CONFIGURATION ============
    
    struct FeeConfig {
        uint256 purchaseFee;          // Basis points
        uint256 sellFee;              // Basis points
        uint256 transferFee;          // Basis points
        uint256 stakingFee;           // Basis points
        uint256 governanceFee;        // Basis points
        address feeCollector;
    }
    
    FeeConfig public feeConfig;
    
    // ============ GENERAL SETTINGS ============
    
    mapping(string => bool) public features;          // Feature flags
    mapping(string => uint256) public parameters;     // Generic parameters
    mapping(string => address) public addresses;      // Contract addresses
    mapping(string => string) public metadata;        // String values
    
    // ============ EVENTS ============
    
    event ValidatorConfigUpdated(string parameter, uint256 newValue);
    event CommissionRatesUpdated(uint8 rank, uint8 level, uint256 rate);
    event StakingConfigUpdated(string parameter, uint256 newValue);
    event GovernanceConfigUpdated(string parameter, uint256 newValue);
    event TreasuryConfigUpdated(string parameter, uint256 newValue);
    event FeatureToggled(string feature, bool enabled);
    event ParameterUpdated(string key, uint256 value);
    event AddressUpdated(string key, address value);
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIG_ADMIN_ROLE, msg.sender);
        
        initializeDefaults();
    }
    
    function initializeDefaults() internal {
        // Validator defaults
        validatorConfig.totalFractions = 1_800_000;
        validatorConfig.startPrice = 10_000000;  // $10
        validatorConfig.endPrice = 100_000000;   // $100
        validatorConfig.kycThreshold = 100;
        validatorConfig.dailyEmission = 1_000_000 * 10**18;
        validatorConfig.halvingInterval = 730 days;
        
        // Commission defaults
        commissionConfig.activeLevels = 4;
        
        // Staking defaults
        stakingConfig.baseAPY = 2500;  // 25%
        stakingConfig.instantUnstakeFee = 50;  // 0.5%
        stakingConfig.delayedUnstakePeriod = 21 days;
        
        // Governance defaults
        governanceConfig.votingPeriod = 3 days;
        governanceConfig.quorumPercentage = 5000;  // 50%
        governanceConfig.executionDelay = 2 days;
        
        // Fee defaults
        feeConfig.purchaseFee = 0;
        feeConfig.sellFee = 0;
        feeConfig.transferFee = 0;
    }
    
    // ============ VALIDATOR CONFIGURATION ============
    
    function setValidatorSaleTimes(uint256 _start, uint256 _end) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        require(_end > _start, "Invalid times");
        validatorConfig.saleStartTime = _start;
        validatorConfig.saleEndTime = _end;
        emit ValidatorConfigUpdated("saleTimes", _start);
    }
    
    function setValidatorKYCThreshold(uint256 _threshold) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        validatorConfig.kycThreshold = _threshold;
        emit ValidatorConfigUpdated("kycThreshold", _threshold);
    }
    
    function setValidatorPricing(uint256 _startPrice, uint256 _endPrice) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        require(_endPrice > _startPrice, "Invalid pricing");
        validatorConfig.startPrice = _startPrice;
        validatorConfig.endPrice = _endPrice;
        emit ValidatorConfigUpdated("pricing", _startPrice);
    }
    
    function setValidatorRewards(uint256 _emission, uint256 _halving) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        validatorConfig.dailyEmission = _emission;
        validatorConfig.halvingInterval = _halving;
        emit ValidatorConfigUpdated("rewards", _emission);
    }
    
    function setValidatorAddresses(
        address _treasury,
        address _ionx,
        address _usdc,
        address _usdt
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        validatorConfig.treasury = _treasury;
        validatorConfig.ionxToken = _ionx;
        validatorConfig.usdcToken = _usdc;
        validatorConfig.usdtToken = _usdt;
        emit AddressUpdated("treasury", _treasury);
    }
    
    // ============ COMMISSION CONFIGURATION ============
    
    function setCommissionLevels(uint8 _levels) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        require(_levels >= 4 && _levels <= 10, "Invalid levels");
        commissionConfig.activeLevels = _levels;
        emit ParameterUpdated("commissionLevels", _levels);
    }
    
    function setCommissionRate(uint8 rank, uint8 level, uint256 rate) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        require(level <= 10, "Invalid level");
        require(rate <= 5000, "Rate too high");
        commissionConfig.rates[rank][level] = rate;
        emit CommissionRatesUpdated(rank, level, rate);
    }
    
    function setRankRequirements(
        uint8 rank,
        uint256 minReferrals,
        uint256 minVolume
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        rankRequirements[rank].minReferrals = minReferrals;
        rankRequirements[rank].minVolume = minVolume;
    }
    
    // ============ STAKING CONFIGURATION ============
    
    function setStakingAPY(uint256 _apy) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        require(_apy <= 10000, "APY too high");
        stakingConfig.baseAPY = _apy;
        emit StakingConfigUpdated("baseAPY", _apy);
    }
    
    function setStakingFees(uint256 _instantFee, uint256 _delayPeriod) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        stakingConfig.instantUnstakeFee = _instantFee;
        stakingConfig.delayedUnstakePeriod = _delayPeriod;
        emit StakingConfigUpdated("fees", _instantFee);
    }
    
    function setStakingLimits(uint256 _min, uint256 _max) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        stakingConfig.minStakeAmount = _min;
        stakingConfig.maxStakeAmount = _max;
        emit StakingConfigUpdated("limits", _min);
    }
    
    // ============ GOVERNANCE CONFIGURATION ============
    
    function setGovernanceParams(
        uint256 _threshold,
        uint256 _period,
        uint256 _quorum
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        governanceConfig.proposalThreshold = _threshold;
        governanceConfig.votingPeriod = _period;
        governanceConfig.quorumPercentage = _quorum;
        emit GovernanceConfigUpdated("params", _threshold);
    }
    
    // ============ TREASURY CONFIGURATION ============
    
    function setTreasuryLimits(
        uint256 _single,
        uint256 _daily,
        uint256 _weekly,
        uint256 _monthly
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        treasuryConfig.singleTxLimit = _single;
        treasuryConfig.dailyLimit = _daily;
        treasuryConfig.weeklyLimit = _weekly;
        treasuryConfig.monthlyLimit = _monthly;
        emit TreasuryConfigUpdated("limits", _single);
    }
    
    function setTreasuryAllocations(
        uint256 _dev,
        uint256 _marketing,
        uint256 _ops,
        uint256 _reserve
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(_dev + _marketing + _ops + _reserve == 10000, "Must total 100%");
        treasuryConfig.developmentAllocation = _dev;
        treasuryConfig.marketingAllocation = _marketing;
        treasuryConfig.operationsAllocation = _ops;
        treasuryConfig.reserveAllocation = _reserve;
        emit TreasuryConfigUpdated("allocations", _dev);
    }
    
    // ============ FEE CONFIGURATION ============
    
    function setFees(
        uint256 _purchase,
        uint256 _sell,
        uint256 _transfer
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(_purchase <= 1000 && _sell <= 1000 && _transfer <= 1000, "Fees too high");
        feeConfig.purchaseFee = _purchase;
        feeConfig.sellFee = _sell;
        feeConfig.transferFee = _transfer;
        emit ParameterUpdated("fees", _purchase);
    }
    
    // ============ FEATURE FLAGS ============
    
    function toggleFeature(string calldata feature, bool enabled) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        features[feature] = enabled;
        emit FeatureToggled(feature, enabled);
    }
    
    function batchToggleFeatures(
        string[] calldata _features,
        bool[] calldata _enabled
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(_features.length == _enabled.length, "Length mismatch");
        for (uint256 i = 0; i < _features.length; i++) {
            features[_features[i]] = _enabled[i];
            emit FeatureToggled(_features[i], _enabled[i]);
        }
    }
    
    // ============ GENERIC PARAMETERS ============
    
    function setParameter(string calldata key, uint256 value) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        parameters[key] = value;
        emit ParameterUpdated(key, value);
    }
    
    function setAddress(string calldata key, address value) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        addresses[key] = value;
        emit AddressUpdated(key, value);
    }
    
    function setMetadata(string calldata key, string calldata value) 
        external 
        onlyRole(CONFIG_ADMIN_ROLE) 
    {
        metadata[key] = value;
    }
    
    // ============ BATCH OPERATIONS ============
    
    function batchSetParameters(
        string[] calldata keys,
        uint256[] calldata values
    ) external onlyRole(CONFIG_ADMIN_ROLE) {
        require(keys.length == values.length, "Length mismatch");
        for (uint256 i = 0; i < keys.length; i++) {
            parameters[keys[i]] = values[i];
            emit ParameterUpdated(keys[i], values[i]);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getValidatorConfig() external view returns (ValidatorConfig memory) {
        return validatorConfig;
    }
    
    function getStakingConfig() external view returns (StakingConfig memory) {
        return stakingConfig;
    }
    
    function getGovernanceConfig() external view returns (GovernanceConfig memory) {
        return governanceConfig;
    }
    
    function getTreasuryConfig() external view returns (TreasuryConfig memory) {
        return treasuryConfig;
    }
    
    function getFeeConfig() external view returns (FeeConfig memory) {
        return feeConfig;
    }
    
    function getCommissionRate(uint8 rank, uint8 level) 
        external 
        view 
        returns (uint256) 
    {
        return commissionConfig.rates[rank][level];
    }
    
    function isFeatureEnabled(string calldata feature) 
        external 
        view 
        returns (bool) 
    {
        return features[feature];
    }
}

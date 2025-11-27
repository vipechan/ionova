// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Staked IONX (st IONX)
 * @dev Liquid staking token that earns validator rewards
 */
contract StakedIONX {
    string public constant name = "Staked IONX";
    string public constant symbol = "stIONX";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    uint256 public totalStaked; // Total IONX staked
    uint256 public rewardsAccrued; // Total rewards earned
    uint256 public lastRewardTime;
    
    uint256 public constant INSTANT_UNSTAKE_FEE = 50; // 0.5% (basis points)
    uint256 public constant UNSTAKE_DELAY = 21 days;
    
    struct UnstakeRequest {
        uint256 amount;
        uint256 unlockTime;
    }
    
    mapping(address => UnstakeRequest) public unstakeRequests;
    
    event Stake(address indexed user, uint256 ionxAmount, uint256 stIonxAmount);
    event Unstake(address indexed user, uint256 stIonxAmount, uint256 ionxAmount);
    event InstantUnstake(address indexed user, uint256 stIonxAmount, uint256 ionxAmount, uint256 fee);
    event RewardsAdded(uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /// @notice Stake IONX and receive stIONX
    function stake(uint256 amount) external payable {
        require(msg.value == amount, "MISMATCH");
        
        uint256 stIonxAmount = totalSupply == 0 
            ? amount 
            : amount * totalSupply / totalStaked;
        
        totalStaked += amount;
        _mint(msg.sender, stIonxAmount);
        
        emit Stake(msg.sender, amount, stIonxAmount);
    }
    
    /// @notice Request to unstake (21-day delay, no fee)
    function requestUnstake(uint256 stIonxAmount) external {
        require(balanceOf[msg.sender] >= stIonxAmount, "INSUFFICIENT_BALANCE");
        
        uint256 ionxAmount = stIonxAmount * totalStaked / totalSupply;
        
        unstakeRequests[msg.sender] = UnstakeRequest({
            amount: ionxAmount,
            unlockTime: block.timestamp + UNSTAKE_DELAY
        });
        
        _burn(msg.sender, stIonxAmount);
    }
    
    /// @notice Claim unstaked IONX after delay
    function claimUnstake() external {
        UnstakeRequest storage request = unstakeRequests[msg.sender];
        require(request.amount > 0, "NO_REQUEST");
        require(block.timestamp >= request.unlockTime, "STILL_LOCKED");
        
        uint256 amount = request.amount;
        delete unstakeRequests[msg.sender];
        
        totalStaked -= amount;
        payable(msg.sender).transfer(amount);
        
        emit Unstake(msg.sender, 0, amount);
    }
    
    /// @notice Instant unstake with 0.5% fee
    function instantUnstake(uint256 stIonxAmount) external {
        require(balanceOf[msg.sender] >= stIonxAmount, "INSUFFICIENT_BALANCE");
        
        uint256 ionxAmount = stIonxAmount * totalStaked / totalSupply;
        uint256 fee = ionxAmount * INSTANT_UNSTAKE_FEE / 10000;
        uint256 amountAfterFee = ionxAmount - fee;
        
        _burn(msg.sender, stIonxAmount);
        totalStaked -= ionxAmount;
        
        // Fee stays in contract as rewards for other stakers
        rewardsAccrued += fee;
        
        payable(msg.sender).transfer(amountAfterFee);
        
        emit InstantUnstake(msg.sender, stIonxAmount, amountAfterFee, fee);
    }
    
    /// @notice Add validator rewards (called by protocol)
    function addRewards() external payable {
        require(msg.value > 0, "NO_REWARDS");
        
        totalStaked += msg.value;
        rewardsAccrued += msg.value;
        lastRewardTime = block.timestamp;
        
        emit RewardsAdded(msg.value);
    }
    
    /// @notice Get exchange rate (how much IONX per stIONX)
    function getExchangeRate() external view returns (uint256) {
        if (totalSupply == 0) return 1e18;
        return totalStaked * 1e18 / totalSupply;
    }
    
    /// @notice Get user's IONX value
    function getIonxValue(address user) external view returns (uint256) {
        if (totalSupply == 0) return 0;
        return balanceOf[user] * totalStaked / totalSupply;
    }
    
    /// @notice Get APY based on recent rewards
    function getAPY() external view returns (uint256) {
        if (totalStaked == 0 || rewardsAccrued == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastRewardTime;
        if (timeElapsed == 0) return 0;
        
        // Annualized return
        return rewardsAccrued * 365 days * 1e18 / totalStaked / timeElapsed;
    }
    
    // ERC-20 functions
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
    
    function _mint(address to, uint256 amount) private {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function _burn(address from, uint256 amount) private {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
    
    // Accept IONX
    receive() external payable {
        // Direct transfers are treated as rewards
        if (msg.value > 0 && msg.sender != address(this)) {
            totalStaked += msg.value;
            rewardsAccrued += msg.value;
        }
    }
}

# Smart Contract Development on Ionova

Complete guide for blockchain developers building on Ionova.

---

## Why Build on Ionova?

### Developer Benefits

✅ **Full Ethereum Compatibility** - Use existing Solidity skills
✅ **500,000 TPS** - Build applications that actually scale
✅ **1-Second Finality** - Better UX than Ethereum
✅ **Low Fees** - $0.005 per transaction (vs $5-50 on Ethereum)
✅ **Complete DeFi Stack** - DEX, lending, staking ready to integrate
✅ **Developer Grants** - Get funded to build

---

## Development Stack

### Primary Language: **Solidity**

**Version Support:** 0.8.0+
**100% Ethereum-compatible** - All Solidity features work

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloIonova {
    string public message = "Hello from Ionova!";
    
    function setMessage(string memory _message) public {
        message = _message;
    }
}
```

### Development Tools

**Framework:** Hardhat (recommended) or Foundry

**Installation:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers
```

**Libraries:**
- OpenZeppelin Contracts
- Chainlink oracles
- The Graph (indexing)

---

## Quick Start Guide

### 1. Project Setup

```bash
# Create new project
mkdir my-ionova-dapp
cd my-ionova-dapp

# Initialize Hardhat
npx hardhat init

# Install dependencies
npm install @openzeppelin/contracts
```

### 2. Configure Network

**hardhat.config.js:**
```javascript
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local devnet
    ionova_local: {
      url: "http://localhost:27000",
      chainId: 1,
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
    },
    // Testnet
    ionova_testnet: {
      url: "https://testnet-rpc.ionova.network",
      chainId: 100,
      accounts: [process.env.PRIVATE_KEY]
    },
    // Mainnet
    ionova_mainnet: {
      url: "https://rpc.ionova.network",
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      ionova: process.env.IONOVA_API_KEY
    }
  }
};
```

### 3. Write Your Contract

**contracts/MyToken.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Token", "MTK") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### 4. Test Your Contract

**test/MyToken.test.js:**
```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  it("Should mint initial supply to owner", async function () {
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    
    const [owner] = await ethers.getSigners();
    const balance = await token.balanceOf(owner.address);
    
    expect(balance).to.equal(ethers.parseEther("1000000"));
  });
});
```

**Run tests:**
```bash
npx hardhat test
```

### 5. Deploy

**scripts/deploy.js:**
```javascript
async function main() {
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();
  await token.waitForDeployment();
  
  console.log("MyToken deployed to:", await token.getAddress());
}

main();
```

**Deploy to Ionova:**
```bash
npx hardhat run scripts/deploy.js --network ionova_testnet
```

---

## Development Patterns

### 1. ERC-20 Token

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameToken is ERC20 {
    constructor() ERC20("Game Token", "GAME") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
```

**Use Cases:** In-game currency, governance tokens, rewards

### 2. NFT (ERC-721)

```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract GameNFT is ERC721 {
    uint256 public tokenCounter;
    
    constructor() ERC721("Game NFT", "GNFT") {}
    
    function mint(address to) public returns (uint256) {
        uint256 tokenId = tokenCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }
}
```

**Use Cases:** Collectibles, in-game items, art, memberships

### 3. Staking Contract

```solidity
contract Staking {
    mapping(address => uint256) public staked;
    mapping(address => uint256) public rewardDebt;
    
    function stake(uint256 amount) external {
        // Transfer tokens from user
        token.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
    }
    
    function unstake(uint256 amount) external {
        require(staked[msg.sender] >= amount, "Insufficient stake");
        staked[msg.sender] -= amount;
        token.transfer(msg.sender, amount);
    }
    
    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender);
        rewardToken.transfer(msg.sender, rewards);
    }
}
```

**Use Cases:** Yield farming, governance participation, liquidity mining

### 4. DAO / Governance

```solidity
contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
    }
    
    Proposal[] public proposals;
    
    function propose(string memory description) external {
        proposals.push(Proposal({
            description: description,
            forVotes: 0,
            againstVotes: 0,
            deadline: block.timestamp + 7 days,
            executed: false
        }));
    }
    
    function vote(uint256 proposalId, bool support) external {
        require(block.timestamp < proposals[proposalId].deadline, "Voting closed");
        uint256 votes = governanceToken.balanceOf(msg.sender);
        
        if (support) {
            proposals[proposalId].forVotes += votes;
        } else {
            proposals[proposalId].againstVotes += votes;
        }
    }
}
```

---

## Integrating with Ionova DeFi

### Using IonovaSwap (DEX)

```solidity
interface IIonovaSwapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract MyDApp {
    IIonovaSwapRouter public router = IIonovaSwapRouter(0x...);
    
    function swapTokens(uint256 amount) external {
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        router.swapExactTokensForTokens(
            amount,
            0, // min amount (use actual slippage)
            path,
            msg.sender,
            block.timestamp + 300
        );
    }
}
```

### Using IonovaLend

```solidity
interface IIonovaLend {
    function supply(address asset, uint256 amount) external;
    function borrow(address asset, uint256 amount) external;
}

contract MyStrategy {
    IIonovaLend public lending = IIonovaLend(0x...);
    
    function depositAndBorrow() external {
        // Supply collateral
        lending.supply(USDC, 10000e6);
        
        // Borrow against it
        lending.borrow(IONX, 1000e18);
    }
}
```

### Using stIONX

```solidity
interface IStakedIONX {
    function stake(uint256 amount) external payable;
    function instantUnstake(uint256 amount) external;
}

contract AutoStaker {
    IStakedIONX public stIONX = IStakedIONX(0x...);
    
    function autoStake() external payable {
        stIONX.stake{value: msg.value}(msg.value);
    }
}
```

---

## Gas Optimization Tips

### 1. Use `calldata` for Read-Only Arrays

```solidity
// ❌ Expensive
function process(uint256[] memory data) external {
    // ...
}

// ✅ Cheaper
function process(uint256[] calldata data) external {
    // ...
}
```

### 2. Pack Variables

```solidity
// ❌ Uses 3 slots
struct User {
    uint256 balance;
    bool active;
    uint256 timestamp;
}

// ✅ Uses 2 slots
struct User {
    uint128 balance;
    uint64 timestamp;
    bool active;
}
```

### 3. Use Events Instead of Storage

```solidity
// ❌ Expensive
mapping(uint256 => string) public messages;

// ✅ Cheaper (if you don't need on-chain reads)
event MessageSent(uint256 indexed id, string message);
```

---

## Testing Best Practices

### Unit Tests

```javascript
describe("MyContract", function () {
  let contract, owner, addr1, addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    contract = await Contract.deploy();
  });
  
  it("Should transfer tokens", async function () {
    await contract.transfer(addr1.address, 100);
    expect(await contract.balanceOf(addr1.address)).to.equal(100);
  });
  
  it("Should revert on insufficient balance", async function () {
    await expect(
      contract.connect(addr1).transfer(addr2.address, 100)
    ).to.be.revertedWith("Insufficient balance");
  });
});
```

### Integration Tests

```javascript
it("Should work with IonovaSwap", async function () {
  const router = await ethers.getContractAt("IIonovaSwapRouter", ROUTER_ADDRESS);
  const token = await ethers.getContractAt("IERC20", TOKEN_ADDRESS);
  
  await token.approve(router.address, ethers.parseEther("100"));
  
  const path = [token.address, IONX_ADDRESS];
  await router.swapExactTokensForTokens(
    ethers.parseEther("100"),
    0,
    path,
    owner.address,
    Date.now() + 300
  );
});
```

### Gas Reporting

```bash
npm install --save-dev hardhat-gas-reporter

# In hardhat.config.js:
gasReporter: {
  enabled: true,
  currency: 'USD',
  token: 'IONX'
}
```

---

## Security Best Practices

### 1. Use OpenZeppelin

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureContract is ReentrancyGuard, Pausable, Ownable {
    function withdraw() external nonReentrant whenNotPaused {
        // Safe withdrawal
    }
}
```

### 2. Checks-Effects-Interactions Pattern

```solidity
function withdraw(uint256 amount) external {
    // Checks
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // Effects
    balances[msg.sender] -= amount;
    
    // Interactions
    payable(msg.sender).transfer(amount);
}
```

### 3. Use SafeMath (Solidity 0.8+ has built-in overflow protection)

```solidity
// Modern Solidity (0.8+) - automatic overflow checks
uint256 a = b + c; // Reverts on overflow

// Explicit unchecked (only when needed)
unchecked {
    uint256 a = b + c; // No overflow check
}
```

### 4. Audit Before Mainnet

- **Self-audit:** Review code carefully
- **Peer review:** Get other developers to review
- **Professional audit:** Hire security firm for mainnet
- **Bug bounty:** Offer rewards for finding bugs

---

## Deployment Checklist

- [ ] Code reviewed and tested
- [ ] Gas optimized
- [ ] Security audit completed
- [ ] Constructor parameters prepared
- [ ] Network configuration verified
- [ ] Sufficient IONX for deployment gas
- [ ] Deployment script tested on testnet
- [ ] Contract verified on explorer
- [ ] Documentation written
- [ ] Frontend integrated

---

## Developer Monetization

### 1. Transaction Fees

Charge fees on your dApp:
```solidity
contract MyDApp {
    uint256 public feePercent = 100; // 1%
    address public feeRecipient;
    
    function trade(uint256 amount) external {
        uint256 fee = amount * feePercent / 10000;
        uint256 amountAfterFee = amount - fee;
        
        token.transferFrom(msg.sender, feeRecipient, fee);
        // ... rest of logic
    }
}
```

### 2. NFT Royalties

```solidity
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract MyNFT is ERC721, ERC2981 {
    constructor() ERC721("My NFT", "MNFT") {
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }
}
```

### 3. Subscription Model

```solidity
contract Subscription {
    mapping(address => uint256) public subscriptionExpiry;
    uint256 public monthlyPrice = 10e18; // 10 IONX
    
    function subscribe() external payable {
        require(msg.value >= monthlyPrice, "Insufficient payment");
        subscriptionExpiry[msg.sender] = block.timestamp + 30 days;
    }
    
    modifier onlySubscriber() {
        require(block.timestamp < subscriptionExpiry[msg.sender], "Subscription expired");
        _;
    }
}
```

---

## Developer Grants & Funding

### Ionova Developer Grants

**Apply for up to $100,000 in funding**

**Categories:**
1. DeFi protocols
2. NFT platforms
3. Gaming
4. Infrastructure
5. Developer tools

**Application:** grants@ionova.network

### Revenue Sharing

**Build high-value dApps, get rewards:**
- Top 10 dApps by volume: 10% fee sharing
- Liquidity providers: Earn from protocol fees
- Bug bounties: Up to $50k per critical bug

---

## Resources

### Documentation
- Architecture: [ARCHITECTURE.md](file:///f:/ionova/requirements/ARCHITECTURE.md)
- Solidity Guide: [SOLIDITY_GUIDE.md](file:///f:/ionova/requirements/SOLIDITY_GUIDE.md)
- Fee Model: [FEE_MODEL.md](file:///f:/ionova/requirements/FEE_MODEL.md)

### Smart Contract Examples
- DEX: [IonovaSwap](file:///f:/ionova/contracts/dex/)
- Lending: [IonovaLend](file:///f:/ionova/contracts/lending/)
- Staking: [StakedIONX](file:///f:/ionova/contracts/staking/)
- NFT: [IonNFT](file:///f:/ionova/contracts/nft/)

### SDK
- JavaScript SDK: [ionova-sdk.js](file:///f:/ionova/sdk/ionova-sdk.js)

### Community
- Discord: https://discord.gg/ionova
- GitHub: https://github.com/ionova-network
- Forum: https://forum.ionova.network
- Twitter: @IonovaNetwork

---

## Support

**Technical Support:**
- Discord: #developer-support channel
- Email: devs@ionova.network
- Office hours: Weekly AMA with core developers

**Getting Help:**
1. Check documentation first
2. Search GitHub issues
3. Ask in Discord
4. Open GitHub issue if bug

---

## Next Steps

1. **Learn:** Read Solidity Guide
2. **Build:** Create your first contract
3. **Test:** Deploy to testnet
4. **Launch:** Go to mainnet
5. **Grow:** Apply for grants
6. **Earn:** Monetize your dApp

**Start building on Ionova today! 🚀**

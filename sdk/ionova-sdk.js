/**
 * Ionova JavaScript SDK
 * Complete SDK for interacting with Ionova ecosystem
 */

import { ethers } from 'ethers';

const CONTRACTS = {
    DEX_FACTORY: '0x...',
    DEX_ROUTER: '0x...',
    LENDING: '0x...',
    STAKING: '0x...',
    NFT_MARKETPLACE: '0x...',
    DAO: '0x...',
    VALIDATOR_FRACTION_NFT: '0x...',
};

export class IonovaSDK {
    constructor(provider, signer) {
        this.provider = provider;
        this.signer = signer;
        this.dex = new IonovaSwap(provider, signer);
        this.lending = new IonovaLend(provider, signer);
        this.staking = new IonovaStaking(provider, signer);
        this.nft = new IonovaNFT(provider, signer);
        this.dao = new IonovaDAOClient(provider, signer);
        this.fractions = new ValidatorFractions(provider, signer);
    }
}

export class IonovaSwap {
    constructor(provider, signer) {
        this.router = new ethers.Contract(CONTRACTS.DEX_ROUTER, ROUTER_ABI, signer);
    }

    async swap(tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
        const path = [tokenIn, tokenOut];
        return await this.router.swapExactTokensForTokens(
            amountIn, minAmountOut, path,
            await this.signer.getAddress(), deadline
        );
    }

    async addLiquidity(tokenA, tokenB, amountA, amountB, minA, minB, deadline) {
        return await this.router.addLiquidity(
            tokenA, tokenB, amountA, amountB, minA, minB,
            await this.signer.getAddress(), deadline
        );
    }

    async getQuote(tokenIn, tokenOut, amountIn) {
        const path = [tokenIn, tokenOut];
        const amounts = await this.router.getAmountsOut(amountIn, path);
        return amounts[1];
    }
}

export class IonovaLend {
    constructor(provider, signer) {
        this.contract = new ethers.Contract(CONTRACTS.LENDING, LENDING_ABI, signer);
    }

    async supply(asset, amount) {
        return await this.contract.supply(asset, amount);
    }

    async borrow(asset, amount) {
        return await this.contract.borrow(asset, amount);
    }

    async repay(asset, amount) {
        return await this.contract.repay(asset, amount);
    }

    async getAPY(asset) {
        const [supplyAPY, borrowAPY] = await this.contract.getAPY(asset);
        return {
            supply: ethers.formatUnits(supplyAPY, 18),
            borrow: ethers.formatUnits(borrowAPY, 18)
        };
    }
}

export class IonovaStaking {
    constructor(provider, signer) {
        this.contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
    }

    async stake(amount) {
        return await this.contract.stake(amount, { value: amount });
    }

    async instantUnstake(stIonxAmount) {
        return await this.contract.instantUnstake(stIonxAmount);
    }

    async getExchangeRate() {
        const rate = await this.contract.getExchangeRate();
        return ethers.formatEther(rate);
    }

    async getAPY() {
        const apy = await this.contract.getAPY();
        return (Number(ethers.formatEther(apy)) * 100).toFixed(2) + '%';
    }
}

export class IonovaNFT {
    constructor(provider, signer) {
        this.marketplace = new ethers.Contract(CONTRACTS.NFT_MARKETPLACE, NFT_ABI, signer);
    }

    async listNFT(nftContract, tokenId, price) {
        return await this.marketplace.list(nftContract, tokenId, price);
    }

    async buyNFT(listingId, price) {
        return await this.marketplace.buy(listingId, { value: price });
    }
}

export class IonovaDAOClient {
    constructor(provider, signer) {
        this.contract = new ethers.Contract(CONTRACTS.DAO, DAO_ABI, signer);
    }

    async createProposal(description) {
        return await this.contract.propose(description);
    }

    async vote(proposalId, support) {
        return await this.contract.vote(proposalId, support);
    }
}

export class ValidatorFractions {
    constructor(provider, signer) {
        const abi = [
            "function buyFractions(uint256) external",
            "function getCurrentPrice() view returns (uint256)",
            "function getTotalCost(uint256) view returns (uint256)",
            "function claimRewards() external",
            "function getSaleStats() view returns (uint256,uint256,uint256,uint256,uint256)",
            "function balanceOf(address,uint256) view returns (uint256)",
            "function fractionsSold() view returns (uint256)"
        ];
        this.contract = new ethers.Contract(CONTRACTS.VALIDATOR_FRACTION_NFT, abi, signer);
        this.signer = signer;
    }

    async buyFractions(quantity, paymentToken) {
        const cost = await this.contract.getTotalCost(quantity);
        const token = new ethers.Contract(paymentToken, ["function approve(address,uint256)"], this.signer);
        await (await token.approve(this.contract.address, cost)).wait();
        return await (await this.contract.buyFractions(quantity)).wait();
    }

    async getCurrentPrice() {
        return ethers.formatUnits(await this.contract.getCurrentPrice(), 6);
    }

    async claimRewards() {
        return await (await this.contract.claimRewards()).wait();
    }

    async getSaleStats() {
        const s = await this.contract.getSaleStats();
        return {
            sold: s[0].toString(),
            remaining: s[1].toString(),
            price: ethers.formatUnits(s[2], 6),
            raised: ethers.formatUnits(s[3], 6),
            percent: s[4].toString()
        };
    }
}

export default IonovaSDK;


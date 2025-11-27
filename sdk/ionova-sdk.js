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
        this.payments = new IonoPay(provider, signer);
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

export class IonoPay {
    constructor(provider, signer) {
        const IONOPAY_ABI = [
            "function sendPayment(address to, bytes32 invoiceId, string memo) external payable",
            "function refundPayment(bytes32 paymentId) external",
            "function registerMerchant(string name, string category) external",
            "function getPayment(bytes32 paymentId) view returns (tuple(address from, address to, uint256 amount, bytes32 invoiceId, string memo, uint256 timestamp, uint8 status, bool refunded))",
            "function getMerchant(address merchant) view returns (tuple(string name, string category, bool verified, uint256 totalReceived, uint256 paymentCount, uint256 registeredAt))",
            "function getUserPayments(address user) view returns (bytes32[])",
            "function getMerchantPayments(address merchant) view returns (bytes32[])",
            "function totalPayments() view returns (uint256)",
            "function totalVolume() view returns (uint256)",
            "event PaymentSent(bytes32 indexed paymentId, address indexed from, address indexed to, uint256 amount, bytes32 invoiceId, string memo)"
        ];

        const CHANNEL_ABI = [
            "function openChannel(address participant2) external payable",
            "function depositToChannel(bytes32 channelId) external payable",
            "function initiateClose(bytes32 channelId) external",
            "function finalizeClose(bytes32 channelId) external",
            "function getChannel(bytes32 channelId) view returns (tuple(address participant1, address participant2, uint256 balance1, uint256 balance2, uint256 nonce, uint256 openedAt, uint256 closingAt, uint8 status, bytes32 finalStateHash))"
        ];

        this.contract = new ethers.Contract(CONTRACTS.IONOPAY || '0x...', IONOPAY_ABI, signer);
        this.channelContract = new ethers.Contract(CONTRACTS.PAYMENT_CHANNEL || '0x...', CHANNEL_ABI, signer);
        this.signer = signer;
        this.provider = provider;
    }

    // ============ Payment Methods ============

    /**
     * Send a zero-fee payment
     * @param {string} to - Recipient address
     * @param {string} amount - Amount in IONX (e.g., "1.5")
     * @param {Object} options - Payment options
     * @returns {Promise<Object>} Transaction receipt with payment ID
     */
    async sendPayment(to, amount, options = {}) {
        const {
            invoiceId = ethers.ZeroHash,
            memo = "",
            onProgress = null
        } = options;

        const amountWei = ethers.parseEther(amount);

        if (onProgress) onProgress('Preparing payment...');

        const tx = await this.contract.sendPayment(to, invoiceId, memo, {
            value: amountWei
        });

        if (onProgress) onProgress('Payment submitted, waiting for confirmation...');

        const receipt = await tx.wait();

        // Extract payment ID from event
        const event = receipt.logs.find(log => {
            try {
                return this.contract.interface.parseLog(log)?.name === 'PaymentSent';
            } catch {
                return false;
            }
        });

        const paymentId = event ? this.contract.interface.parseLog(event).args[0] : null;

        if (onProgress) onProgress('Payment confirmed!');

        return {
            paymentId,
            transactionHash: receipt.hash,
            from: await this.signer.getAddress(),
            to,
            amount,
            invoiceId,
            memo
        };
    }

    /**
     * Request a refund for a payment (merchant only)
     * @param {string} paymentId - Payment ID to refund
     * @returns {Promise<Object>} Transaction receipt
     */
    async refundPayment(paymentId) {
        const tx = await this.contract.refundPayment(paymentId);
        return await tx.wait();
    }

    /**
     * Get payment details
     * @param {string} paymentId - Payment ID
     * @returns {Promise<Object>} Payment details
     */
    async getPayment(paymentId) {
        const payment = await this.contract.getPayment(paymentId);
        return {
            from: payment.from,
            to: payment.to,
            amount: ethers.formatEther(payment.amount),
            invoiceId: payment.invoiceId,
            memo: payment.memo,
            timestamp: new Date(Number(payment.timestamp) * 1000),
            status: ['Pending', 'Completed', 'Failed', 'Refunded'][payment.status],
            refunded: payment.refunded
        };
    }

    /**
     * Get user's payment history
     * @param {string} address - User address (optional, defaults to signer)
     * @returns {Promise<Array>} Array of payment IDs
     */
    async getPaymentHistory(address = null) {
        const userAddress = address || await this.signer.getAddress();
        return await this.contract.getUserPayments(userAddress);
    }

    // ============ Merchant Methods ============

    /**
     * Register as a merchant
     * @param {Object} businessInfo - Business information
     * @returns {Promise<Object>} Transaction receipt
     */
    async registerMerchant(businessInfo) {
        const { name, category } = businessInfo;
        const tx = await this.contract.registerMerchant(name, category);
        return await tx.wait();
    }

    /**
     * Get merchant profile
     * @param {string} address - Merchant address (optional, defaults to signer)
     * @returns {Promise<Object>} Merchant profile
     */
    async getMerchantProfile(address = null) {
        const merchantAddress = address || await this.signer.getAddress();
        const merchant = await this.contract.getMerchant(merchantAddress);

        return {
            name: merchant.name,
            category: merchant.category,
            verified: merchant.verified,
            totalReceived: ethers.formatEther(merchant.totalReceived),
            paymentCount: Number(merchant.paymentCount),
            registeredAt: new Date(Number(merchant.registeredAt) * 1000)
        };
    }

    /**
     * Get merchant analytics
     * @returns {Promise<Object>} Analytics data
     */
    async getMerchantAnalytics() {
        const address = await this.signer.getAddress();
        const merchant = await this.contract.getMerchant(address);
        const payments = await this.contract.getMerchantPayments(address);

        return {
            totalRevenue: ethers.formatEther(merchant.totalReceived),
            paymentCount: Number(merchant.paymentCount),
            averagePayment: merchant.paymentCount > 0
                ? ethers.formatEther(merchant.totalReceived / merchant.paymentCount)
                : "0",
            recentPayments: payments.slice(-10) // Last 10 payments
        };
    }

    // ============ Payment Channel Methods ============

    /**
     * Open a payment channel for high-frequency payments
     * @param {string} counterparty - Other participant address
     * @param {string} amount - Initial deposit amount
     * @returns {Promise<Object>} Channel details
     */
    async openPaymentChannel(counterparty, amount) {
        const amountWei = ethers.parseEther(amount);
        const tx = await this.channelContract.openChannel(counterparty, {
            value: amountWei
        });
        const receipt = await tx.wait();

        // Extract channel ID from event
        return {
            transactionHash: receipt.hash,
            counterparty,
            initialDeposit: amount
        };
    }

    /**
     * Close a payment channel
     * @param {string} channelId - Channel ID
     * @returns {Promise<Object>} Transaction receipt
     */
    async closePaymentChannel(channelId) {
        const tx = await this.channelContract.initiateClose(channelId);
        await tx.wait();

        // Wait for challenge period (in production, this would be handled differently)
        console.log('Channel closing initiated. Challenge period: 24 hours');

        return {
            channelId,
            status: 'closing'
        };
    }

    /**
     * Finalize channel closing after challenge period
     * @param {string} channelId - Channel ID
     * @returns {Promise<Object>} Transaction receipt
     */
    async finalizeChannelClose(channelId) {
        const tx = await this.channelContract.finalizeClose(channelId);
        return await tx.wait();
    }

    // ============ Utility Methods ============

    /**
     * Generate payment QR code data
     * @param {string} amount - Payment amount
     * @param {Object} options - Additional options
     * @returns {string} QR code data string
     */
    async generatePaymentQR(amount, options = {}) {
        const {
            invoiceId = ethers.ZeroHash,
            memo = "",
            recipient = await this.signer.getAddress()
        } = options;

        const qrData = {
            type: 'ionopay',
            version: '1.0',
            recipient,
            amount,
            invoiceId,
            memo,
            timestamp: Date.now()
        };

        return JSON.stringify(qrData);
    }

    /**
     * Parse payment QR code data
     * @param {string} qrData - QR code data string
     * @returns {Object} Parsed payment data
     */
    parsePaymentQR(qrData) {
        try {
            const data = JSON.parse(qrData);
            if (data.type !== 'ionopay') {
                throw new Error('Invalid QR code type');
            }
            return data;
        } catch (error) {
            throw new Error('Invalid payment QR code');
        }
    }

    /**
     * Get total payment statistics
     * @returns {Promise<Object>} Global payment stats
     */
    async getGlobalStats() {
        const totalPayments = await this.contract.totalPayments();
        const totalVolume = await this.contract.totalVolume();

        return {
            totalPayments: Number(totalPayments),
            totalVolume: ethers.formatEther(totalVolume)
        };
    }
}

export default IonovaSDK;


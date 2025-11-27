/**
 * Mock data for Ionova wallet demo
 * Provides realistic test data for development and demonstrations
 */

// Mock wallet addresses
export const MOCK_ADDRESSES = {
    user: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    merchant1: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    merchant2: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    validator1: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    validator2: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
};

// Mock transaction history
export const generateMockTransactions = (count = 20) => {
    const types = ['send', 'receive', 'stake', 'unstake', 'swap', 'claim'];
    const statuses = ['confirmed', 'pending', 'failed'];
    const transactions = [];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const status = i < 3 ? 'pending' : (Math.random() > 0.95 ? 'failed' : 'confirmed');
        const amount = (Math.random() * 1000).toFixed(4);
        const timestamp = Date.now() - (i * 3600000); // 1 hour intervals

        transactions.push({
            id: `0x${Math.random().toString(16).substr(2, 64)}`,
            type,
            status,
            amount,
            from: type === 'receive' ? MOCK_ADDRESSES.merchant1 : MOCK_ADDRESSES.user,
            to: type === 'send' ? MOCK_ADDRESSES.merchant2 : MOCK_ADDRESSES.user,
            timestamp,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            blockNumber: 15000000 + i,
            gasUsed: '21000',
            gasPrice: '0.000000001',
            memo: type === 'send' ? 'Payment for services' : '',
        });
    }

    return transactions;
};

// Mock balance data
export const MOCK_BALANCES = {
    ionx: {
        balance: 12547.8923,
        usdValue: 1254.79,
        change24h: 5.67,
    },
    staked: {
        balance: 50000,
        usdValue: 5000,
        rewards: 342.15,
        apr: 250,
    },
    ethereum: {
        eth: 2.5,
        usdValue: 5000,
    },
    bsc: {
        bnb: 15.3,
        usdValue: 4590,
    },
    polygon: {
        matic: 8500,
        usdValue: 6800,
    },
};

// Mock staking data
export const MOCK_STAKING = {
    totalStaked: 50000,
    pendingRewards: 342.15,
    claimedRewards: 1250.50,
    apr: 250,
    validators: [
        {
            address: MOCK_ADDRESSES.validator1,
            name: 'Ionova Validator #1',
            stakedAmount: 30000,
            commission: 5,
            uptime: 99.98,
            rewards: 205.29,
        },
        {
            address: MOCK_ADDRESSES.validator2,
            name: 'Ionova Validator #2',
            stakedAmount: 20000,
            commission: 10,
            uptime: 99.95,
            rewards: 136.86,
        },
    ],
    history: [
        { type: 'stake', amount: 10000, timestamp: Date.now() - 86400000 * 30 },
        { type: 'stake', amount: 20000, timestamp: Date.now() - 86400000 * 20 },
        { type: 'stake', amount: 20000, timestamp: Date.now() - 86400000 * 10 },
        { type: 'claim', amount: 125.50, timestamp: Date.now() - 86400000 * 5 },
    ],
};

// Mock NFT data (Validator Fractions)
export const MOCK_NFTS = [
    {
        id: 1,
        name: 'Validator Fraction #1',
        image: 'https://via.placeholder.com/300x300?text=NFT+1',
        fractions: 100,
        purchasePrice: 1000,
        currentValue: 1250,
        rewards: 45.50,
        purchaseDate: Date.now() - 86400000 * 60,
    },
    {
        id: 2,
        name: 'Validator Fraction #2',
        image: 'https://via.placeholder.com/300x300?text=NFT+2',
        fractions: 50,
        purchasePrice: 500,
        currentValue: 625,
        rewards: 22.75,
        purchaseDate: Date.now() - 86400000 * 45,
    },
    {
        id: 3,
        name: 'Validator Fraction #3',
        image: 'https://via.placeholder.com/300x300?text=NFT+3',
        fractions: 200,
        purchasePrice: 2000,
        currentValue: 2500,
        rewards: 91.00,
        purchaseDate: Date.now() - 86400000 * 30,
    },
];

// Mock portfolio data
export const MOCK_PORTFOLIO = {
    totalValue: 23145.29,
    totalValueUSD: 23145.29,
    change24h: 5.67,
    change24hPercent: 0.024,
    assets: [
        { symbol: 'IONX', balance: 12547.89, value: 1254.79, allocation: 5.4 },
        { symbol: 'Staked IONX', balance: 50000, value: 5000, allocation: 21.6 },
        { symbol: 'ETH', balance: 2.5, value: 5000, allocation: 21.6 },
        { symbol: 'BNB', balance: 15.3, value: 4590, allocation: 19.8 },
        { symbol: 'MATIC', balance: 8500, value: 6800, allocation: 29.4 },
        { symbol: 'NFTs', balance: 3, value: 4400, allocation: 19.0 },
    ],
    history: generatePortfolioHistory(30),
};

function generatePortfolioHistory(days) {
    const history = [];
    let value = 20000;

    for (let i = days; i >= 0; i--) {
        value += (Math.random() - 0.5) * 1000;
        history.push({
            date: new Date(Date.now() - i * 86400000).toISOString(),
            value: Math.max(value, 15000),
        });
    }

    return history;
}

// Mock payment data (IonoPay)
export const MOCK_PAYMENTS = {
    sent: [
        {
            id: '0x123...',
            to: MOCK_ADDRESSES.merchant1,
            amount: 50.00,
            memo: 'Coffee purchase',
            timestamp: Date.now() - 3600000,
            status: 'confirmed',
        },
        {
            id: '0x456...',
            to: MOCK_ADDRESSES.merchant2,
            amount: 125.50,
            memo: 'Online shopping',
            timestamp: Date.now() - 7200000,
            status: 'confirmed',
        },
    ],
    received: [
        {
            id: '0x789...',
            from: MOCK_ADDRESSES.merchant1,
            amount: 200.00,
            memo: 'Refund',
            timestamp: Date.now() - 10800000,
            status: 'confirmed',
        },
    ],
    stats: {
        totalSent: 1250.50,
        totalReceived: 850.25,
        paymentCount: 45,
        savedFees: 37.52, // Fees saved vs traditional payment processors
    },
};

// Mock merchant data
export const MOCK_MERCHANTS = [
    {
        address: MOCK_ADDRESSES.merchant1,
        name: 'Ionova Coffee Shop',
        category: 'Food & Beverage',
        verified: true,
        rating: 4.8,
        totalSales: 125000,
        paymentCount: 1543,
    },
    {
        address: MOCK_ADDRESSES.merchant2,
        name: 'Crypto Electronics',
        category: 'Electronics',
        verified: true,
        rating: 4.9,
        totalSales: 450000,
        paymentCount: 892,
    },
];

// Mock network stats
export const MOCK_NETWORK_STATS = {
    ionova: {
        tps: 42350,
        blockTime: 1.0,
        totalTransactions: 125000000,
        activeValidators: 21,
        totalStaked: 5000000000,
        avgFee: 0.0001,
    },
    ethereum: {
        tps: 15,
        blockTime: 12.0,
        avgFee: 2.50,
    },
    bsc: {
        tps: 160,
        blockTime: 3.0,
        avgFee: 0.10,
    },
    polygon: {
        tps: 65,
        blockTime: 2.0,
        avgFee: 0.01,
    },
};

// Mock gas prices
export const MOCK_GAS_PRICES = {
    ionova: {
        slow: 0.00001,
        standard: 0.00005,
        fast: 0.0001,
    },
    ethereum: {
        slow: 15,
        standard: 25,
        fast: 40,
    },
};

// Helper function to get random mock data
export const getRandomTransaction = () => {
    const txs = generateMockTransactions(1);
    return txs[0];
};

export const getRandomBalance = (min = 100, max = 10000) => {
    return (Math.random() * (max - min) + min).toFixed(4);
};

// Mock API delay simulation
export const mockApiDelay = (ms = 500) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock wallet connection
export const MOCK_WALLET_INFO = {
    address: MOCK_ADDRESSES.user,
    chainId: 1337,
    chainName: 'Ionova',
    balance: MOCK_BALANCES.ionx.balance,
    isConnected: true,
    connector: 'MetaMask',
};

export default {
    MOCK_ADDRESSES,
    MOCK_BALANCES,
    MOCK_STAKING,
    MOCK_NFTS,
    MOCK_PORTFOLIO,
    MOCK_PAYMENTS,
    MOCK_MERCHANTS,
    MOCK_NETWORK_STATS,
    MOCK_GAS_PRICES,
    MOCK_WALLET_INFO,
    generateMockTransactions,
    getRandomTransaction,
    getRandomBalance,
    mockApiDelay,
};

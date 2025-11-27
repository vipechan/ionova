/**
 * Multichain configuration for Ionova wallet
 * Supports multiple EVM-compatible chains
 */

export const SUPPORTED_CHAINS = {
    // Ionova Mainnet
    ionova: {
        id: 1337, // Replace with actual Ionova chain ID
        name: 'Ionova',
        network: 'ionova',
        nativeCurrency: {
            name: 'IONX',
            symbol: 'IONX',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://rpc.ionova.network'] },
            public: { http: ['https://rpc.ionova.network'] },
        },
        blockExplorers: {
            default: { name: 'IonovaScan', url: 'https://scan.ionova.network' },
        },
        testnet: false,
        icon: '⚡',
    },

    // Ionova Testnet
    ionovaTestnet: {
        id: 31337, // Replace with actual testnet chain ID
        name: 'Ionova Testnet',
        network: 'ionova-testnet',
        nativeCurrency: {
            name: 'IONX',
            symbol: 'IONX',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://testnet-rpc.ionova.network'] },
            public: { http: ['https://testnet-rpc.ionova.network'] },
        },
        blockExplorers: {
            default: { name: 'Testnet Explorer', url: 'https://testnet-scan.ionova.network' },
        },
        testnet: true,
        icon: '⚡',
    },

    // Ethereum Mainnet
    ethereum: {
        id: 1,
        name: 'Ethereum',
        network: 'homestead',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://eth.llamarpc.com'] },
            public: { http: ['https://eth.llamarpc.com'] },
        },
        blockExplorers: {
            default: { name: 'Etherscan', url: 'https://etherscan.io' },
        },
        testnet: false,
        icon: '⟠',
    },

    // Binance Smart Chain
    bsc: {
        id: 56,
        name: 'BNB Smart Chain',
        network: 'bsc',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://bsc-dataseed.binance.org'] },
            public: { http: ['https://bsc-dataseed.binance.org'] },
        },
        blockExplorers: {
            default: { name: 'BscScan', url: 'https://bscscan.com' },
        },
        testnet: false,
        icon: '🔶',
    },

    // Polygon
    polygon: {
        id: 137,
        name: 'Polygon',
        network: 'matic',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://polygon-rpc.com'] },
            public: { http: ['https://polygon-rpc.com'] },
        },
        blockExplorers: {
            default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
        },
        testnet: false,
        icon: '🟣',
    },

    // Arbitrum
    arbitrum: {
        id: 42161,
        name: 'Arbitrum One',
        network: 'arbitrum',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://arb1.arbitrum.io/rpc'] },
            public: { http: ['https://arb1.arbitrum.io/rpc'] },
        },
        blockExplorers: {
            default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
        },
        testnet: false,
        icon: '🔵',
    },

    // Optimism
    optimism: {
        id: 10,
        name: 'Optimism',
        network: 'optimism',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://mainnet.optimism.io'] },
            public: { http: ['https://mainnet.optimism.io'] },
        },
        blockExplorers: {
            default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
        },
        testnet: false,
        icon: '🔴',
    },

    // Avalanche
    avalanche: {
        id: 43114,
        name: 'Avalanche',
        network: 'avalanche',
        nativeCurrency: {
            name: 'AVAX',
            symbol: 'AVAX',
            decimals: 18,
        },
        rpcUrls: {
            default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
            public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
        },
        blockExplorers: {
            default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
        },
        testnet: false,
        icon: '🔺',
    },
};

// Get chain by ID
export const getChainById = (chainId) => {
    return Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId);
};

// Get chain by network name
export const getChainByNetwork = (network) => {
    return SUPPORTED_CHAINS[network];
};

// Check if chain is supported
export const isChainSupported = (chainId) => {
    return Object.values(SUPPORTED_CHAINS).some((chain) => chain.id === chainId);
};

// Get all mainnet chains
export const getMainnetChains = () => {
    return Object.values(SUPPORTED_CHAINS).filter((chain) => !chain.testnet);
};

// Get all testnet chains
export const getTestnetChains = () => {
    return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.testnet);
};

// Default chain (Ionova mainnet)
export const DEFAULT_CHAIN = SUPPORTED_CHAINS.ionova;

// Preferred chains for display
export const PREFERRED_CHAINS = [
    SUPPORTED_CHAINS.ionova,
    SUPPORTED_CHAINS.ethereum,
    SUPPORTED_CHAINS.bsc,
    SUPPORTED_CHAINS.polygon,
    SUPPORTED_CHAINS.arbitrum,
    SUPPORTED_CHAINS.optimism,
];

export default SUPPORTED_CHAINS;

require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Local development
        hardhat: {
            chainId: 1337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },

        // Testnets
        sepolia: {
            url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
        goerli: {
            url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
        mumbai: {
            url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 80001,
        },

        // Mainnets
        ethereum: {
            url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 1,
        },
        polygon: {
            url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
            chainId: 137,
        },
        arbitrum: {
            url: "https://arb1.arbitrum.io/rpc",
            accounts: [PRIVATE_KEY],
            chainId: 42161,
        },

        // Ionova (custom network - update with actual RPC)
        ionova: {
            url: process.env.IONOVA_RPC_URL || "http://localhost:8545",
            accounts: [PRIVATE_KEY],
            chainId: parseInt(process.env.IONOVA_CHAIN_ID || "1337"),
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

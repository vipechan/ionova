const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Web3
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

// Contract ABIs (simplified)
const AdminControllerABI = require('./abis/AdminController.json');
const adminController = new ethers.Contract(
    process.env.ADMIN_CONTROLLER_ADDRESS,
    AdminControllerABI,
    adminWallet
);

// Simple in-memory cache (use Redis in production)
const cache = {
    contracts: [],
    parameters: {},
    features: {}
};

// =============  DASHBOARD API =============

app.get('/api/admin/dashboard/stats', async (req, res) => {
    try {
        const stats = {
            totalUsers: 1234, // From database
            totalVolume: 5000000, // From analytics
            activeFeatures: 15, // Count enabled features
            recentActions: [
                {
                    timestamp: Date.now(),
                    admin: '0x123...',
                    action: 'Updated KYC threshold',
                    contract: 'ValidatorFractionNFT'
                }
            ]
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= CONTRACTS API =============

app.get('/api/admin/contracts', async (req, res) => {
    try {
        const [names, addresses] = await adminController.getAllContracts();

        const contracts = names.map((name, i) => ({
            name,
            address: addresses[i],
            featureCount: 5, // Get from contract
            paramCount: 10 // Get from contract
        }));

        cache.contracts = contracts;
        res.json({ contracts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/contracts', async (req, res) => {
    try {
        const { name, address } = req.body;

        const tx = await adminController.registerContract(name, address);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/contracts/:address/config', async (req, res) => {
    try {
        const { address } = req.params;

        // Get parameters from AdminController
        const parameters = {
            kycThreshold: {
                type: 'uint256',
                value: 100,
                description: 'Minimum fractions requiring KYC'
            },
            saleStartTime: {
                type: 'uint256',
                value: Math.floor(Date.now() / 1000),
                description: 'Sale start timestamp'
            },
            // Add more parameters dynamically
        };

        const features = {
            kycRequired: {
                enabled: true,
                description: 'Require KYC for purchases'
            },
            affiliateProgram: {
                enabled: true,
                description: 'Enable affiliate commissions'
            },
            // Add more features
        };

        res.json({ parameters, features });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= PARAMETERS API =============

app.post('/api/admin/contracts/:address/parameters', async (req, res) => {
    try {
        const { address } = req.params;
        const { paramName, value, paramType } = req.body;

        let tx;

        if (paramType === 'uint256') {
            tx = await adminController.setUintParam(
                address,
                paramName,
                value,
                `Updated ${paramName}`,
                0,
                ethers.MaxUint256
            );
        } else if (paramType === 'bool') {
            tx = await adminController.setBoolParam(
                address,
                paramName,
                value,
                `Updated ${paramName}`
            );
        } else if (paramType === 'address') {
            tx = await adminController.setAddressParam(
                address,
                paramName,
                value,
                `Updated ${paramName}`
            );
        }

        await tx.wait();

        // Also update the actual contract
        await updateContractParameter(address, paramName, value);

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to update actual contract
async function updateContractParameter(contractAddress, paramName, value) {
    // Get contract instance
    const contract = new ethers.Contract(
        contractAddress,
        ['function setKYCThreshold(uint256) external'], // Dynamic ABI
        adminWallet
    );

    // Map parameter name to function
    const functionMap = {
        'kycThreshold': 'setKYCThreshold',
        'saleStartTime': 'setSaleStartTime',
        // Add more mappings
    };

    const functionName = functionMap[paramName];
    if (functionName && contract[functionName]) {
        const tx = await contract[functionName](value);
        await tx.wait();
    }
}

// ============= FEATURES API =============

app.post('/api/admin/contracts/:address/features', async (req, res) => {
    try {
        const { address } = req.params;
        const { featureName, enabled } = req.body;

        const tx = await adminController.toggleFeature(
            address,
            featureName,
            enabled
        );
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= USERS API =============

app.get('/api/admin/users', async (req, res) => {
    try {
        const { contract, kyc } = req.query;

        // Get users from database
        // This is a placeholder - implement with your database
        const users = [
            {
                address: '0x742d35...',
                kycVerified: true,
                fractionsOwned: 150,
                totalSpent: 2250
            },
            {
                address: '0x853f21...',
                kycVerified: false,
                fractionsOwned: 50,
                totalSpent: 750
            }
        ];

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/kyc/approve', async (req, res) => {
    try {
        const { address } = req.body;

        // Get the contract
        const contract = new ethers.Contract(
            process.env.VALIDATOR_CONTRACT_ADDRESS,
            ['function setKYCStatus(address,bool) external'],
            adminWallet
        );

        const tx = await contract.setKYCStatus(address, true);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= BATCH OPERATIONS =============

app.post('/api/admin/batch/parameters', async (req, res) => {
    try {
        const { contractAddress, updates } = req.body;

        const paramNames = updates.map(u => u.name);
        const values = updates.map(u => u.value);

        const tx = await adminController.batchUpdateParams(
            contractAddress,
            paramNames,
            values
        );
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/batch/features', async (req, res) => {
    try {
        const { contractAddress, features } = req.body;

        const featureNames = features.map(f => f.name);
        const enabled = features.map(f => f.enabled);

        const tx = await adminController.batchToggleFeatures(
            contractAddress,
            featureNames,
            enabled
        );
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= ANALYTICS API =============

app.get('/api/admin/analytics/:contract', async (req, res) => {
    try {
        const { contract } = req.params;

        // Get analytics from events
        const filter = adminController.filters.ParameterUpdated(contract);
        const events = await adminController.queryFilter(filter);

        const analytics = {
            totalUpdates: events.length,
            lastUpdate: events[events.length - 1]?.args,
            updateHistory: events.map(e => ({
                param: e.args.paramName,
                timestamp: e.block.timestamp
            }))
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= ERROR HANDLING =============

app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎛️ Admin API running on port ${PORT}`);
});

module.exports = app;

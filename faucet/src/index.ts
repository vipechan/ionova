import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.RPC_URL || 'http://localhost:27000';
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || '100';
const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;

// Rate limiter: 1 request per IP per hour
const rateLimiter = new RateLimiterMemory({
    points: 1,
    duration: 3600, // 1 hour
});

// Rate limiter: 5 requests per address per day
const addressLimiter = new RateLimiterMemory({
    points: 5,
    duration: 86400, // 24 hours
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        network: 'Ionova Testnet',
        faucetAmount: `${FAUCET_AMOUNT} IONX`,
    });
});

// Get faucet info
app.get('/info', (req: Request, res: Response) => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    res.json({
        address: wallet.address,
        amount: `${FAUCET_AMOUNT} IONX`,
        rateLimit: '1 request per hour per IP',
        addressLimit: '5 requests per day per address',
    });
});

// Request testnet tokens
app.post('/request', async (req: Request, res: Response) => {
    const { address } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Validate address
    if (!address || !ethers.isAddress(address)) {
        return res.status(400).json({
            error: 'Invalid Ethereum address',
        });
    }

    try {
        // Check IP rate limit
        try {
            await rateLimiter.consume(ip);
        } catch (rateLimiterRes: any) {
            const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000 / 60);
            return res.status(429).json({
                error: 'Too many requests from this IP',
                retryAfter: `${retryAfter} minutes`,
            });
        }

        // Check address rate limit
        try {
            await addressLimiter.consume(address.toLowerCase());
        } catch (rateLimiterRes: any) {
            const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000 / 60 / 60);
            return res.status(429).json({
                error: 'This address has reached its daily limit',
                retryAfter: `${retryAfter} hours`,
            });
        }

        // Connect to Ionova network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const faucetWallet = new ethers.Wallet(PRIVATE_KEY, provider);

        // Check faucet balance
        const balance = await provider.getBalance(faucetWallet.address);
        const amountToSend = ethers.parseEther(FAUCET_AMOUNT);

        if (balance < amountToSend) {
            return res.status(503).json({
                error: 'Faucet is out of funds',
                message: 'Please contact the Ionova team',
            });
        }

        // Send transaction
        const tx = await faucetWallet.sendTransaction({
            to: address,
            value: amountToSend,
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        res.json({
            success: true,
            txHash: receipt?.hash,
            amount: `${FAUCET_AMOUNT} IONX`,
            to: address,
            blockNumber: receipt?.blockNumber,
            message: `Successfully sent ${FAUCET_AMOUNT} IONX to ${address}`,
        });

    } catch (error: any) {
        console.error('Faucet error:', error);
        res.status(500).json({
            error: 'Failed to send tokens',
            message: error.message,
        });
    }
});

// Get faucet balance
app.get('/balance', async (req: Request, res: Response) => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const faucetWallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const balance = await provider.getBalance(faucetWallet.address);

        res.json({
            address: faucetWallet.address,
            balance: ethers.formatEther(balance),
            balanceIONX: `${ethers.formatEther(balance)} IONX`,
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Failed to get balance',
            message: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚰 Ionova Faucet running on port ${PORT}`);
    console.log(`📡 Connected to ${RPC_URL}`);
    console.log(`💰 Dispensing ${FAUCET_AMOUNT} IONX per request`);
});

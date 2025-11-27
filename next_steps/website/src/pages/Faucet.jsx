import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatEther, parseEther } from 'viem';

const FAUCET_ABI = [
    {
        "inputs": [],
        "name": "requestTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "canRequest",
        "outputs": [
            { "internalType": "bool", "name": "eligible", "type": "bool" },
            { "internalType": "uint256", "name": "timeUntilNext", "type": "uint256" },
            { "internalType": "uint256", "name": "remainingAllowance", "type": "uint256" },
            { "internalType": "string", "name": "reason", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getFaucetStats",
        "outputs": [
            { "internalType": "uint256", "name": "faucetBalance", "type": "uint256" },
            { "internalType": "uint256", "name": "dripAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "cooldownPeriod", "type": "uint256" },
            { "internalType": "uint256", "name": "totalDistributed", "type": "uint256" },
            { "internalType": "uint256", "name": "totalRequests", "type": "uint256" },
            { "internalType": "uint256", "name": "requestsRemaining", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getUserStats",
        "outputs": [
            { "internalType": "uint256", "name": "lastRequest", "type": "uint256" },
            { "internalType": "uint256", "name": "totalReceived", "type": "uint256" },
            { "internalType": "uint256", "name": "nextRequestTime", "type": "uint256" },
            { "internalType": "bool", "name": "canRequestNow", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const FAUCET_ADDRESS = '0x...'; // Deploy address

export default function FaucetPage() {
    const { address, isConnected } = useAccount();
    const [countdown, setCountdown] = useState('');

    // Get faucet stats
    const { data: faucetStats } = useContractRead({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'getFaucetStats',
    });

    // Check if user can request
    const { data: canRequestData } = useContractRead({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'canRequest',
        args: [address],
        enabled: !!address,
    });

    // Get user stats
    const { data: userStats } = useContractRead({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'getUserStats',
        args: [address],
        enabled: !!address,
    });

    // Request tokens
    const { write: requestTokens, data: txData } = useContractWrite({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'requestTokens',
    });

    const { isLoading: isRequesting, isSuccess } = useWaitForTransaction({
        hash: txData?.hash,
    });

    // Countdown timer
    useEffect(() => {
        if (!canRequestData || canRequestData[0]) return;

        const interval = setInterval(() => {
            const timeLeft = Number(canRequestData[1]);
            if (timeLeft <= 0) {
                setCountdown('Ready!');
                return;
            }

            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [canRequestData]);

    if (!isConnected) {
        return (
            <div className="faucet-page">
                <div className="faucet-hero">
                    <h1>🚰 Ionova Testnet Faucet</h1>
                    <p>Get free testnet IONX to start building on Ionova</p>
                    <button className="btn btn-primary btn-large">Connect Wallet</button>
                </div>
            </div>
        );
    }

    const eligible = canRequestData?.[0];
    const reason = canRequestData?.[3];
    const dripAmount = faucetStats?.[1];
    const faucetBalance = faucetStats?.[0];
    const totalDistributed = faucetStats?.[3];
    const requestsRemaining = faucetStats?.[5];

    return (
        <div className="faucet-page">
            {/* Hero Section */}
            <div className="faucet-hero">
                <h1>🚰 Ionova Testnet Faucet</h1>
                <p className="subtitle">Get free testnet IONX tokens for development</p>

                <div className="faucet-stats-row">
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{dripAmount ? formatEther(dripAmount) : '0'} IONX</div>
                        <div className="stat-label">Per Request</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-value">24 Hours</div>
                        <div className="stat-label">Cooldown</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">100 IONX</div>
                        <div className="stat-label">Max Per Address</div>
                    </div>
                </div>
            </div>

            {/* Main Faucet Card */}
            <div className="faucet-main-card">
                <h2>Request Testnet IONX</h2>

                {isSuccess && (
                    <div className="success-banner">
                        ✅ Success! {dripAmount ? formatEther(dripAmount) : '0'} IONX sent to your wallet
                    </div>
                )}

                <div className="wallet-info">
                    <div className="info-row">
                        <span>Your Address:</span>
                        <code>{address?.slice(0, 6)}...{address?.slice(-4)}</code>
                    </div>

                    {userStats && (
                        <>
                            <div className="info-row">
                                <span>Total Received:</span>
                                <strong>{formatEther(userStats[1])} IONX</strong>
                            </div>

                            <div className="info-row">
                                <span>Remaining Allowance:</span>
                                <strong>{canRequestData ? formatEther(canRequestData[2]) : '0'} IONX</strong>
                            </div>
                        </>
                    )}
                </div>

                {!eligible && (
                    <div className="cooldown-timer">
                        <div className="timer-icon">⏳</div>
                        <div className="timer-text">
                            <div className="timer-label">Next request available in:</div>
                            <div className="timer-value">{countdown}</div>
                            <div className="timer-reason">{reason}</div>
                        </div>
                    </div>
                )}

                <button
                    className="btn btn-primary btn-large btn-faucet"
                    onClick={() => requestTokens?.()}
                    disabled={!eligible || isRequesting}
                >
                    {isRequesting ? (
                        <>
                            <span className="spinner"></span>
                            Requesting...
                        </>
                    ) : eligible ? (
                        <>💧 Request {dripAmount ? formatEther(dripAmount) : '0'} IONX</>
                    ) : (
                        <>🔒 Not Available - {reason}</>
                    )}
                </button>
            </div>

            {/* Faucet Statistics */}
            <div className="faucet-statistics">
                <h3>📊 Faucet Statistics</h3>

                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-label">Faucet Balance</div>
                        <div className="stat-value">{faucetBalance ? formatEther(faucetBalance) : '0'} IONX</div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-label">Requests Remaining</div>
                        <div className="stat-value">{requestsRemaining?.toString() || '0'}</div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-label">Total Distributed</div>
                        <div className="stat-value">{totalDistributed ? formatEther(totalDistributed) : '0'} IONX</div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-label">Total Requests</div>
                        <div className="stat-value">{faucetStats?.[4]?.toString() || '0'}</div>
                    </div>
                </div>
            </div>

            {/* How to Use */}
            <div className="faucet-guide">
                <h3>🎓 How to Use the Faucet</h3>

                <div className="guide-steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Connect Your Wallet</h4>
                            <p>Make sure you're connected to Ionova Testnet (Chain ID: 8889)</p>
                        </div>
                    </div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Request Tokens</h4>
                            <p>Click the request button to receive 10 testnet IONX</p>
                        </div>
                    </div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Start Building</h4>
                            <p>Use the testnet IONX to deploy contracts and test your dApp</p>
                        </div>
                    </div>

                    <div className="step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h4>Request Again (24h)</h4>
                            <p>Come back after 24 hours if you need more testnet tokens</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Developer Resources */}
            <div className="faucet-resources">
                <h3>🛠️ Developer Resources</h3>

                <div className="resource-grid">
                    <a href="https://docs.ionova.network" className="resource-card">
                        <div className="resource-icon">📖</div>
                        <div className="resource-title">Documentation</div>
                        <div className="resource-desc">Complete developer guides</div>
                    </a>

                    <a href="https://explorer-testnet.ionova.network" className="resource-card">
                        <div className="resource-icon">🔍</div>
                        <div className="resource-title">Block Explorer</div>
                        <div className="resource-desc">View testnet transactions</div>
                    </a>

                    <a href="https://discord.gg/ionova" className="resource-card">
                        <div className="resource-icon">💬</div>
                        <div className="resource-title">Discord</div>
                        <div className="resource-desc">Get community support</div>
                    </a>

                    <a href="https://github.com/ionova-network" className="resource-card">
                        <div className="resource-icon">💻</div>
                        <div className="resource-title">GitHub</div>
                        <div className="resource-desc">Example contracts</div>
                    </a>
                </div>
            </div>

            {/* Network Info */}
            <div className="network-info">
                <h4>⚙️ Ionova Testnet Configuration</h4>
                <div className="code-block">
                    <code>
                        Network Name: Ionova Testnet<br />
                        RPC URL: https://testnet-rpc.ionova.network<br />
                        Chain ID: 8889<br />
                        Currency: IONX<br />
                        Explorer: https://explorer-testnet.ionova.network
                    </code>
                </div>
            </div>
        </div>
    );
}

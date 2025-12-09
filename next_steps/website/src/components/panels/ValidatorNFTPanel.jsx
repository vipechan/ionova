import React, { useState, useEffect } from 'react';
import { useContract, useSigner } from 'wagmi';

export function ValidatorNFTPanel() {
    const [config, setConfig] = useState({
        // Sale Configuration
        saleStartTime: 0,
        saleEndTime: 0,
        fractionsSold: 0,
        totalFractions: 1800000,

        // Pricing
        startPrice: 10,
        endPrice: 100,

        // KYC Settings
        kycRequired: true,
        kycThreshold: 100,

        // Affiliate Settings
        affiliateEnabled: true,
        commissionRates: {
            starter: 5,
            bronze: 10,
            silver: 15,
            gold: 20
        },

        // IONX Rewards
        initialDailyEmission: 1000000,
        halvingInterval: 730,

        // Contract State
        paused: false,
        saleActive: false,

        // Addresses
        treasury: '',
        usdcToken: '',
        usdtToken: '',
        ionxToken: ''
    });

    const [loading, setLoading] = useState(false);

    const updateSetting = async (setting, value) => {
        setLoading(true);
        try {
            // Call contract function based on setting
            const functionMap = {
                'kycThreshold': 'setKYCThreshold',
                'kycRequired': 'setKYCRequired',
                'saleStartTime': 'setSaleTimes',
                'paused': value ? 'pause' : 'unpause',
                // Add more mappings
            };

            const functionName = functionMap[setting];
            if (functionName) {
                // Call contract
                console.log(`Calling ${functionName}(${value})`);
                // const tx = await contract[functionName](value);
                // await tx.wait();

                alert(`✅ ${setting} updated successfully!`);
            }
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="validator-nft-panel">
            <h2>🎫 Validator Fraction NFT Settings</h2>

            {/* Sale Configuration */}
            <section className="panel-section">
                <h3>📅 Sale Configuration</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Sale Start Time</label>
                        <input
                            type="datetime-local"
                            value={new Date(config.saleStartTime * 1000).toISOString().slice(0, 16)}
                            onChange={(e) => {
                                const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                                updateSetting('saleStartTime', timestamp);
                            }}
                        />
                        <span className="setting-description">When the sale begins</span>
                    </div>

                    <div className="setting-item">
                        <label>Sale End Time</label>
                        <input
                            type="datetime-local"
                            value={new Date(config.saleEndTime * 1000).toISOString().slice(0, 16)}
                            onChange={(e) => {
                                const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                                updateSetting('saleEndTime', timestamp);
                            }}
                        />
                        <span className="setting-description">When the sale ends</span>
                    </div>

                    <div className="setting-item">
                        <label>Fractions Sold</label>
                        <div className="progress-stat">
                            <span className="stat-value">{config.fractionsSold.toLocaleString()}</span>
                            <span className="stat-total">/ {config.totalFractions.toLocaleString()}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(config.fractionsSold / config.totalFractions) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Configuration */}
            <section className="panel-section">
                <h3>💵 Pricing Configuration</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Start Price (USD)</label>
                        <input
                            type="number"
                            value={config.startPrice}
                            disabled
                        />
                        <span className="setting-description">First fraction price (immutable)</span>
                    </div>

                    <div className="setting-item">
                        <label>End Price (USD)</label>
                        <input
                            type="number"
                            value={config.endPrice}
                            disabled
                        />
                        <span className="setting-description">Last fraction price (immutable)</span>
                    </div>

                    <div className="setting-item">
                        <label>Current Price</label>
                        <div className="stat-display">
                            $55.25
                        </div>
                        <span className="setting-description">Price for next fraction</span>
                    </div>
                </div>
            </section>

            {/* KYC Settings */}
            <section className="panel-section">
                <h3>🔐 KYC Settings</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>KYC Required for All</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={config.kycRequired}
                                onChange={(e) => updateSetting('kycRequired', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-description">
                            {config.kycRequired ? 'KYC required for all purchases' : 'KYC optional (below threshold)'}
                        </span>
                    </div>

                    <div className="setting-item">
                        <label>KYC Threshold (Fractions)</label>
                        <input
                            type="number"
                            value={config.kycThreshold}
                            onChange={(e) => updateSetting('kycThreshold', parseInt(e.target.value))}
                        />
                        <span className="setting-description">
                            KYC required for purchases above this amount
                        </span>
                    </div>

                    <div className="setting-item">
                        <label>KYC Threshold (USD)</label>
                        <div className="stat-display">
                            ${(config.kycThreshold * 55).toLocaleString()}
                        </div>
                        <span className="setting-description">Approximate USD value at current price</span>
                    </div>
                </div>
            </section>

            {/* Affiliate Program */}
            <section className="panel-section">
                <h3>🤝 Affiliate Program</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Enable Affiliate Program</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={config.affiliateEnabled}
                                onChange={(e) => updateSetting('affiliateEnabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-description">Toggle affiliate commissions</span>
                    </div>

                    <div className="setting-item">
                        <label>Starter Commission (%)</label>
                        <input
                            type="number"
                            value={config.commissionRates.starter}
                            onChange={(e) => updateSetting('starterCommission', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="setting-item">
                        <label>Bronze Commission (%)</label>
                        <input
                            type="number"
                            value={config.commissionRates.bronze}
                            onChange={(e) => updateSetting('bronzeCommission', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="setting-item">
                        <label>Silver Commission (%)</label>
                        <input
                            type="number"
                            value={config.commissionRates.silver}
                            onChange={(e) => updateSetting('silverCommission', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="setting-item">
                        <label>Gold Commission (%)</label>
                        <input
                            type="number"
                            value={config.commissionRates.gold}
                            onChange={(e) => updateSetting('goldCommission', parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            {/* IONX Rewards */}
            <section className="panel-section">
                <h3>🎁 IONX Reward Settings</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Daily Emission (IONX)</label>
                        <input
                            type="number"
                            value={config.initialDailyEmission}
                            disabled
                        />
                        <span className="setting-description">Initial daily emission (immutable)</span>
                    </div>

                    <div className="setting-item">
                        <label>Halving Interval (Days)</label>
                        <input
                            type="number"
                            value={config.halvingInterval}
                            disabled
                        />
                        <span className="setting-description">Days between halvings (immutable)</span>
                    </div>

                    <div className="setting-item">
                        <label>Current Emission Rate</label>
                        <div className="stat-display">
                            500,000 IONX/day
                        </div>
                        <span className="setting-description">After 1 halving</span>
                    </div>
                </div>
            </section>

            {/* Contract Control */}
            <section className="panel-section">
                <h3>⚙️ Contract Control</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Contract Paused</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={config.paused}
                                onChange={(e) => updateSetting('paused', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-description">
                            {config.paused ? '❌ All operations paused' : '✅ Contract operational'}
                        </span>
                    </div>

                    <div className="setting-item">
                        <label>Sale Active</label>
                        <div className="stat-display">
                            {config.saleActive ? '✅ Active' : '❌ Inactive'}
                        </div>
                        <span className="setting-description">Based on sale times</span>
                    </div>
                </div>
            </section>

            {/* Token Addresses */}
            <section className="panel-section">
                <h3>🔗 Contract Addresses</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Treasury Address</label>
                        <input
                            type="text"
                            value={config.treasury}
                            onChange={(e) => updateSetting('treasury', e.target.value)}
                            placeholder="0x..."
                        />
                    </div>

                    <div className="setting-item">
                        <label>USDC Token</label>
                        <input
                            type="text"
                            value={config.usdcToken}
                            disabled
                            placeholder="0x..."
                        />
                    </div>

                    <div className="setting-item">
                        <label>USDT Token</label>
                        <input
                            type="text"
                            value={config.usdtToken}
                            disabled
                            placeholder="0x..."
                        />
                    </div>

                    <div className="setting-item">
                        <label>IONX Token</label>
                        <input
                            type="text"
                            value={config.ionxToken}
                            onChange={(e) => updateSetting('ionxToken', e.target.value)}
                            placeholder="0x..."
                        />
                    </div>
                </div>
            </section>

            {/* Action Buttons */}
            <section className="panel-section">
                <h3>🚀 Quick Actions</h3>
                <div className="action-buttons">
                    <button className="action-btn primary">
                        View All Purchases
                    </button>
                    <button className="action-btn">
                        Export KYC List
                    </button>
                    <button className="action-btn">
                        Download Analytics
                    </button>
                    <button className="action-btn warning">
                        Emergency Pause
                    </button>
                </div>
            </section>
        </div>
    );
}

export default ValidatorNFTPanel;

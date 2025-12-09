import React, { useState } from 'react';

export function StakedIONXPanel() {
    const [config, setConfig] = useState({
        // Staking Parameters
        baseAPY: 25,
        totalStaked: 5000000,
        totalSupply: 6000000,

        // Unstaking
        instantUnstakeFee: 0.5,
        delayedUnstakePeriod: 21,

        // Rewards
        rewardRate: 25,
        lastRewardUpdate: Date.now(),
        totalRewardsDistributed: 1250000,

        // Exchange Rate
        exchangeRate: 1.05,

        // Contract State
        paused: false,
        stakingEnabled: true,
        unstakingEnabled: true
    });

    return (
        <div className="staked-ionx-panel">
            <h2>💰 Staked IONX Settings</h2>

            {/* Staking Parameters */}
            <section className="panel-section">
                <h3>📊 Staking Parameters</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Base APY (%)</label>
                        <input
                            type="number"
                            value={config.baseAPY}
                            onChange={(e) => setConfig({ ...config, baseAPY: e.target.value })}
                        />
                        <span className="setting-description">Annual percentage yield</span>
                    </div>

                    <div className="setting-item">
                        <label>Total Staked (IONX)</label>
                        <div className="stat-display">
                            {config.totalStaked.toLocaleString()}
                        </div>
                        <span className="setting-description">Total IONX currently staked</span>
                    </div>

                    <div className="setting-item">
                        <label>stIONX Supply</label>
                        <div className="stat-display">
                            {config.totalSupply.toLocaleString()}
                        </div>
                        <span className="setting-description">Total stIONX tokens minted</span>
                    </div>

                    <div className="setting-item">
                        <label>Exchange Rate</label>
                        <div className="stat-display">
                            1 stIONX = {config.exchangeRate} IONX
                        </div>
                        <span className="setting-description">Current stIONX to IONX rate</span>
                    </div>
                </div>
            </section>

            {/* Unstaking Settings */}
            <section className="panel-section">
                <h3>⏱️ Unstaking Settings</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Instant Unstake Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.instantUnstakeFee}
                            onChange={(e) => setConfig({ ...config, instantUnstakeFee: e.target.value })}
                        />
                        <span className="setting-description">Fee for instant unstaking</span>
                    </div>

                    <div className="setting-item">
                        <label>Delayed Unstake Period (Days)</label>
                        <input
                            type="number"
                            value={config.delayedUnstakePeriod}
                            onChange={(e) => setConfig({ ...config, delayedUnstakePeriod: e.target.value })}
                        />
                        <span className="setting-description">Wait time for zero-fee unstaking</span>
                    </div>
                </div>
            </section>

            {/* Rewards Configuration */}
            <section className="panel-section">
                <h3>🎁 Rewards Configuration</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Reward Rate (%/year)</label>
                        <input
                            type="number"
                            value={config.rewardRate}
                            onChange={(e) => setConfig({ ...config, rewardRate: e.target.value })}
                        />
                    </div>

                    <div className="setting-item">
                        <label>Total Rewards Distributed</label>
                        <div className="stat-display">
                            {config.totalRewardsDistributed.toLocaleString()} IONX
                        </div>
                    </div>
                </div>
            </section>

            {/* Contract Control */}
            <section className="panel-section">
                <h3>⚙️ Contract Control</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Staking Enabled</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={config.stakingEnabled}
                                onChange={(e) => setConfig({ ...config, stakingEnabled: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <label>Unstaking Enabled</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={config.unstakingEnabled}
                                onChange={(e) => setConfig({ ...config, unstakingEnabled: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                    </div>
                </div>

                <div className="setting-item">
                    <label>Contract Paused</label>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={config.paused}
                            onChange={(e) => setConfig({ ...config, paused: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
        </div>
      </section >

        {/* Quick Actions */ }
        < section className = "panel-section" >
        <h3>🚀 Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary">Update Rewards</button>
          <button className="action-btn">View Stakers</button>
          <button className="action-btn">Export Data</button>
        </div>
      </section >
    </div >
  );
}

export default StakedIONXPanel;

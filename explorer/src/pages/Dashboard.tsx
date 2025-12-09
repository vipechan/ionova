import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const SIGNATURE_COLORS = {
    ECDSA: '#ef4444',
    Dilithium: '#10b981',
    'SPHINCS+': '#3b82f6',
    Falcon: '#f59e0b',
    Hybrid: '#8b5cf6',
};

export default function Dashboard() {
    // Mock data - in production, fetch from API
    const stats = {
        totalBlocks: 142857,
        totalTransactions: 5834921,
        tps: 38429,
        gasSavings: '1,294,582 IONX',
        quantumSafePercent: 67,
    };

    const signatureDistribution = [
        { name: 'ECDSA', value: 33, count: 1925124 },
        { name: 'Dilithium', value: 45, count: 2625715 },
        { name: 'Hybrid', value: 22, count: 1284082 },
    ];

    const dailyTPS = [
        { day: 'Mon', tps: 35200 },
        { day: 'Tue', tps: 39100 },
        { day: 'Wed', tps: 42300 },
        { day: 'Thu', tps: 38900 },
        { day: 'Fri', tps: 41500 },
        { day: 'Sat', tps: 37800 },
        { day: 'Sun', tps: 36400 },
    ];

    return (
        <div className="dashboard">
            <h1>Network Dashboard</h1>

            {/* Key Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Blocks</div>
                        <div className="stat-value">{stats.totalBlocks.toLocaleString()}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💸</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Transactions</div>
                        <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
                    </div>
                </div>

                <div className="stat-card highlight">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <div className="stat-label">Current TPS</div>
                        <div className="stat-value">{stats.tps.toLocaleString()}</div>
                    </div>
                </div>

                <div className="stat-card quantum">
                    <div className="stat-icon">🔐</div>
                    <div className="stat-content">
                        <div className="stat-label">Quantum-Safe</div>
                        <div className="stat-value">{stats.quantumSafePercent}%</div>
                    </div>
                </div>

                <div className="stat-card savings">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Gas Savings (PQ Subsidy)</div>
                        <div className="stat-value">{stats.gasSavings}</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* TPS Chart */}
                <div className="chart-card">
                    <h2>Daily TPS</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyTPS}>
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="tps" fill="#667eea" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Signature Distribution */}
                <div className="chart-card">
                    <h2>Signature Types</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={signatureDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, value }) => `${name}: ${value}%`}
                            >
                                {signatureDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={SIGNATURE_COLORS[entry.name as keyof typeof SIGNATURE_COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quantum Safe Progress */}
            <div className="quantum-progress-card">
                <h2>Quantum-Safe Migration Progress</h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${stats.quantumSafePercent}%` }}
                    >
                        {stats.quantumSafePercent}%
                    </div>
                </div>
                <p className="progress-label">
                    {stats.quantumSafePercent}% of transactions using quantum-resistant signatures
                </p>
                <div className="signature-breakdown">
                    {signatureDistribution.map((sig) => (
                        <div key={sig.name} className="sig-item">
                            <span
                                className="sig-color"
                                style={{ backgroundColor: SIGNATURE_COLORS[sig.name as keyof typeof SIGNATURE_COLORS] }}
                            />
                            <span className="sig-name">{sig.name}</span>
                            <span className="sig-count">{sig.count.toLocaleString()} txs</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

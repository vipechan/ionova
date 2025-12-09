import React, { useState, useEffect } from 'react';
import { useAccount, useContract, useSigner } from 'wagmi';
import './AdminPanel.css';

// Backend API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export function AdminPanel() {
    const { address } = useAccount();
    const { data: signer } = useSigner();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [contracts, setContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    const [parameters, setParameters] = useState({});
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadContracts();
    }, []);

    useEffect(() => {
        if (selectedContract) {
            loadContractConfig(selectedContract);
        }
    }, [selectedContract]);

    // Load all contracts
    const loadContracts = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/contracts`);
            const data = await response.json();
            setContracts(data.contracts);
        } catch (error) {
            console.error('Error loading contracts:', error);
        }
    };

    // Load contract configuration
    const loadContractConfig = async (contractAddress) => {
        try {
            const response = await fetch(`${API_URL}/admin/contracts/${contractAddress}/config`);
            const data = await response.json();
            setParameters(data.parameters);
            setFeatures(data.features);
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    // Update parameter
    const updateParameter = async (paramName, value, paramType) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/contracts/${selectedContract}/parameters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paramName, value, paramType })
            });

            if (response.ok) {
                alert('Parameter updated successfully!');
                loadContractConfig(selectedContract);
            }
        } catch (error) {
            console.error('Error updating parameter:', error);
            alert('Failed to update parameter');
        }
        setLoading(false);
    };

    // Toggle feature
    const toggleFeature = async (featureName, enabled) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/contracts/${selectedContract}/features`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureName, enabled })
            });

            if (response.ok) {
                alert(`Feature ${enabled ? 'enabled' : 'disabled'} successfully!`);
                loadContractConfig(selectedContract);
            }
        } catch (error) {
            console.error('Error toggling feature:', error);
            alert('Failed to toggle feature');
        }
        setLoading(false);
    };

    return (
        <div className="admin-panel">
            {/* Header */}
            <header className="admin-header">
                <h1>🎛️ Ionova Admin Panel</h1>
                <div className="admin-info">
                    <span>Admin: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
            </header>

            {/* Navigation */}
            <nav className="admin-nav">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={activeTab === 'contracts' ? 'active' : ''}
                    onClick={() => setActiveTab('contracts')}
                >
                    Contracts
                </button>
                <button
                    className={activeTab === 'parameters' ? 'active' : ''}
                    onClick={() => setActiveTab('parameters')}
                >
                    Parameters
                </button>
                <button
                    className={activeTab === 'features' ? 'active' : ''}
                    onClick={() => setActiveTab('features')}
                >
                    Features
                </button>
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={activeTab === 'analytics' ? 'active' : ''}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
            </nav>

            {/* Main Content */}
            <main className="admin-content">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <DashboardTab contracts={contracts} />
                )}

                {/* Contracts Tab */}
                {activeTab === 'contracts' && (
                    <ContractsTab
                        contracts={contracts}
                        selectedContract={selectedContract}
                        setSelectedContract={setSelectedContract}
                        onReload={loadContracts}
                    />
                )}

                {/* Parameters Tab */}
                {activeTab === 'parameters' && (
                    <ParametersTab
                        contract={selectedContract}
                        parameters={parameters}
                        onUpdate={updateParameter}
                        loading={loading}
                    />
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                    <FeaturesTab
                        contract={selectedContract}
                        features={features}
                        onToggle={toggleFeature}
                        loading={loading}
                    />
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <UsersTab contract={selectedContract} />
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <AnalyticsTab contracts={contracts} />
                )}
            </main>
        </div>
    );
}

// Dashboard Tab Component
function DashboardTab({ contracts }) {
    const [stats, setStats] = useState({});

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const response = await fetch(`${API_URL}/admin/dashboard/stats`);
        const data = await response.json();
        setStats(data);
    };

    return (
        <div className="dashboard-tab">
            <h2>Dashboard Overview</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Contracts</h3>
                    <p className="stat-value">{contracts.length}</p>
                </div>

                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{stats.totalUsers || 0}</p>
                </div>

                <div className="stat-card">
                    <h3>Total Volume</h3>
                    <p className="stat-value">${(stats.totalVolume || 0).toLocaleString()}</p>
                </div>

                <div className="stat-card">
                    <h3>Active Features</h3>
                    <p className="stat-value">{stats.activeFeatures || 0}</p>
                </div>
            </div>

            <div className="recent-actions">
                <h3>Recent Actions</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Contract</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(stats.recentActions || []).map((action, i) => (
                            <tr key={i}>
                                <td>{new Date(action.timestamp).toLocaleString()}</td>
                                <td>{action.admin}</td>
                                <td>{action.action}</td>
                                <td>{action.contract}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Contracts Tab Component
function ContractsTab({ contracts, selectedContract, setSelectedContract, onReload }) {
    const [newContract, setNewContract] = useState({ name: '', address: '' });

    const addContract = async () => {
        try {
            await fetch(`${API_URL}/admin/contracts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContract)
            });

            alert('Contract registered!');
            setNewContract({ name: '', address: '' });
            onReload();
        } catch (error) {
            alert('Failed to register contract');
        }
    };

    return (
        <div className="contracts-tab">
            <h2>Contract Management</h2>

            {/* Add New Contract */}
            <div className="add-contract">
                <h3>Register New Contract</h3>
                <input
                    placeholder="Contract Name"
                    value={newContract.name}
                    onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                />
                <input
                    placeholder="Contract Address"
                    value={newContract.address}
                    onChange={(e) => setNewContract({ ...newContract, address: e.target.value })}
                />
                <button onClick={addContract}>Add Contract</button>
            </div>

            {/* Contracts List */}
            <div className="contracts-list">
                <h3>Registered Contracts</h3>
                {contracts.map(contract => (
                    <div
                        key={contract.address}
                        className={`contract-item ${selectedContract === contract.address ? 'selected' : ''}`}
                        onClick={() => setSelectedContract(contract.address)}
                    >
                        <div className="contract-name">{contract.name}</div>
                        <div className="contract-address">{contract.address}</div>
                        <div className="contract-stats">
                            Features: {contract.featureCount} | Params: {contract.paramCount}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Parameters Tab Component
function ParametersTab({ contract, parameters, onUpdate, loading }) {
    const [editingParam, setEditingParam] = useState(null);
    const [newValue, setNewValue] = useState('');

    if (!contract) {
        return <div className="no-selection">Please select a contract first</div>;
    }

    const startEdit = (paramName, currentValue) => {
        setEditingParam(paramName);
        setNewValue(currentValue.toString());
    };

    const saveEdit = (paramName, paramType) => {
        onUpdate(paramName, newValue, paramType);
        setEditingParam(null);
    };

    return (
        <div className="parameters-tab">
            <h2>Contract Parameters</h2>
            <p className="contract-name">Contract: {contract}</p>

            <table className="parameters-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Current Value</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(parameters).map(([name, param]) => (
                        <tr key={name}>
                            <td className="param-name">{name}</td>
                            <td>{param.type}</td>
                            <td>
                                {editingParam === name ? (
                                    <input
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        type={param.type === 'uint256' ? 'number' : 'text'}
                                    />
                                ) : (
                                    <span className="param-value">{param.value.toString()}</span>
                                )}
                            </td>
                            <td className="param-description">{param.description}</td>
                            <td>
                                {editingParam === name ? (
                                    <>
                                        <button onClick={() => saveEdit(name, param.type)} disabled={loading}>
                                            Save
                                        </button>
                                        <button onClick={() => setEditingParam(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={() => startEdit(name, param.value)}>Edit</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Features Tab Component
function FeaturesTab({ contract, features, onToggle, loading }) {
    if (!contract) {
        return <div className="no-selection">Please select a contract first</div>;
    }

    return (
        <div className="features-tab">
            <h2>Feature Flags</h2>
            <p className="contract-name">Contract: {contract}</p>

            <div className="features-grid">
                {Object.entries(features).map(([name, feature]) => (
                    <div key={name} className="feature-card">
                        <div className="feature-header">
                            <h3>{name}</h3>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={feature.enabled}
                                    onChange={(e) => onToggle(name, e.target.checked)}
                                    disabled={loading}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <p className="feature-description">{feature.description}</p>
                        <div className="feature-status">
                            Status: <span className={feature.enabled ? 'enabled' : 'disabled'}>
                                {feature.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Users Tab Component
function UsersTab({ contract }) {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ kycVerified: 'all' });

    useEffect(() => {
        loadUsers();
    }, [contract, filters]);

    const loadUsers = async () => {
        const response = await fetch(
            `${API_URL}/admin/users?contract=${contract}&kyc=${filters.kycVerified}`
        );
        const data = await response.json();
        setUsers(data.users);
    };

    const approveKYC = async (address) => {
        await fetch(`${API_URL}/admin/kyc/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        loadUsers();
    };

    return (
        <div className="users-tab">
            <h2>User Management</h2>

            {/* Filters */}
            <div className="filters">
                <select
                    value={filters.kycVerified}
                    onChange={(e) => setFilters({ ...filters, kycVerified: e.target.value })}
                >
                    <option value="all">All Users</option>
                    <option value="true">KYC Verified</option>
                    <option value="false">Not Verified</option>
                </select>
            </div>

            {/* Users Table */}
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>KYC Status</th>
                        <th>Fractions Owned</th>
                        <th>Total Spent</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.address}>
                            <td>{user.address}</td>
                            <td>
                                <span className={`kyc-badge ${user.kycVerified ? 'verified' : 'pending'}`}>
                                    {user.kycVerified ? '✅ Verified' : '⏳ Pending'}
                                </span>
                            </td>
                            <td>{user.fractionsOwned}</td>
                            <td>${user.totalSpent.toLocaleString()}</td>
                            <td>
                                {!user.kycVerified && (
                                    <button onClick={() => approveKYC(user.address)}>Approve KYC</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Analytics Tab Component
function AnalyticsTab({ contracts }) {
    // Add charts and analytics here
    return (
        <div className="analytics-tab">
            <h2>Analytics & Reports</h2>
            <p>Coming soon: Charts, graphs, and detailed analytics</p>
        </div>
    );
}

export default AdminPanel;

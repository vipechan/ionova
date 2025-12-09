import React, { useState, useEffect } from 'react';
import { useContract, useSigner } from 'wagmi';
import ValidatorNFTPanel from './panels/ValidatorNFTPanel';
import StakedIONXPanel from './panels/StakedIONXPanel';
import GovernancePanel from './panels/GovernancePanel';
import DAOTreasuryPanel from './panels/DAOTreasuryPanel';
import AirdropPanel from './panels/AirdropPanel';
import './ContractAdminPanels.css';

export function ContractAdminPanels() {
    const [selectedContract, setSelectedContract] = useState('validator');

    const contracts = [
        {
            id: 'validator',
            name: 'Validator Fraction NFT',
            icon: '🎫',
            component: ValidatorNFTPanel
        },
        {
            id: 'staking',
            name: 'Staked IONX',
            icon: '💰',
            component: StakedIONXPanel
        },
        {
            id: 'governance',
            name: 'Governance Token',
            icon: '🗳️',
            component: GovernancePanel
        },
        {
            id: 'treasury',
            name: 'DAO Treasury',
            icon: '🏦',
            component: DAOTreasuryPanel
        },
        {
            id: 'airdrop',
            name: 'KYC Airdrop',
            icon: '🎁',
            component: AirdropPanel
        }
    ];

    const ActivePanel = contracts.find(c => c.id === selectedContract)?.component;

    return (
        <div className="contract-admin-panels">
            <header className="panels-header">
                <h1>📊 Contract Administration</h1>
                <p>Manage each contract's settings individually</p>
            </header>

            <div className="panels-layout">
                {/* Left Sidebar - Contract Selection */}
                <aside className="contract-selector">
                    <h3>Select Contract</h3>
                    {contracts.map(contract => (
                        <button
                            key={contract.id}
                            className={`contract-button ${selectedContract === contract.id ? 'active' : ''}`}
                            onClick={() => setSelectedContract(contract.id)}
                        >
                            <span className="contract-icon">{contract.icon}</span>
                            <span className="contract-name">{contract.name}</span>
                        </button>
                    ))}
                </aside>

                {/* Main Content - Selected Contract Panel */}
                <main className="contract-panel-content">
                    {ActivePanel && <ActivePanel />}
                </main>
            </div>
        </div>
    );
}

export default ContractAdminPanels;

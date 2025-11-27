import { useState } from 'react';
import { useSwitchNetwork, useNetwork } from 'wagmi';
import { SUPPORTED_CHAINS, PREFERRED_CHAINS, isChainSupported } from '../config/chains';
import './NetworkSwitcher.css';

/**
 * Network switcher component
 * Allows users to switch between supported chains
 */
function NetworkSwitcher() {
    const [showDropdown, setShowDropdown] = useState(false);
    const { chain } = useNetwork();
    const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork();

    const currentChain = chain ? SUPPORTED_CHAINS[Object.keys(SUPPORTED_CHAINS).find(
        key => SUPPORTED_CHAINS[key].id === chain.id
    )] : null;

    const handleSwitchNetwork = async (chainId) => {
        if (switchNetwork) {
            switchNetwork(chainId);
            setShowDropdown(false);
        }
    };

    const addNetwork = async (chainConfig) => {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${chainConfig.id.toString(16)}`,
                    chainName: chainConfig.name,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: [chainConfig.rpcUrls.default.http[0]],
                    blockExplorerUrls: [chainConfig.blockExplorers.default.url],
                }],
            });
            setShowDropdown(false);
        } catch (error) {
            console.error('Error adding network:', error);
        }
    };

    if (!chain) {
        return null;
    }

    const isUnsupported = !isChainSupported(chain.id);

    return (
        <div className="network-switcher">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`network-button ${isUnsupported ? 'unsupported' : ''}`}
            >
                <span className="network-icon">
                    {currentChain?.icon || '🌐'}
                </span>
                <span className="network-name">
                    {isUnsupported ? 'Unsupported Network' : (currentChain?.name || chain.name)}
                </span>
                <span className="dropdown-arrow">▼</span>
            </button>

            {showDropdown && (
                <>
                    <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                    <div className="network-dropdown">
                        <div className="dropdown-header">
                            <h3>Select Network</h3>
                            <button onClick={() => setShowDropdown(false)} className="close-btn">✕</button>
                        </div>

                        <div className="network-list">
                            {PREFERRED_CHAINS.map((chainConfig) => {
                                const isActive = chain?.id === chainConfig.id;
                                const isPending = pendingChainId === chainConfig.id;
                                const isAvailable = chains?.some(c => c.id === chainConfig.id);

                                return (
                                    <button
                                        key={chainConfig.id}
                                        onClick={() => {
                                            if (isAvailable) {
                                                handleSwitchNetwork(chainConfig.id);
                                            } else {
                                                addNetwork(chainConfig);
                                            }
                                        }}
                                        className={`network-option ${isActive ? 'active' : ''}`}
                                        disabled={isPending || isLoading}
                                    >
                                        <div className="network-info">
                                            <span className="network-icon-large">{chainConfig.icon}</span>
                                            <div className="network-details">
                                                <div className="network-name-large">{chainConfig.name}</div>
                                                <div className="network-currency">
                                                    {chainConfig.nativeCurrency.symbol}
                                                </div>
                                            </div>
                                        </div>
                                        {isActive && <span className="active-badge">✓ Active</span>}
                                        {isPending && <div className="spinner-small"></div>}
                                        {!isAvailable && !isActive && (
                                            <span className="add-badge">+ Add</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                <span>Failed to switch network</span>
                            </div>
                        )}

                        <div className="dropdown-footer">
                            <p className="network-note">
                                Don't see your network? Add it to your wallet first.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default NetworkSwitcher;

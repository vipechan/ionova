// IonovaAirdrop.js - Frontend integration
import { ethers } from 'ethers';

const AIRDROP_CONTRACT = '0x...'; // Deploy address
const IONX_TOKEN = '0x...'; // IONX token address

const airdropABI = [
    'function claimAirdrop() external',
    'function hasClaimedAirdrop(address user) external view returns (bool)',
    'function getBalance() external view returns (uint256)',
    'function getRemainingAirdrops() external view returns (uint256)',
    'function getStats() external view returns (uint256, uint256, uint256, uint256)'
];

export class AirdropManager {
    constructor(provider) {
        this.provider = provider;
        this.contract = new ethers.Contract(AIRDROP_CONTRACT, airdropABI, provider);
    }

    /**
     * Claim 100 IONX airdrop
     */
    async claimAirdrop(signer) {
        const contract = this.contract.connect(signer);
        const tx = await contract.claimAirdrop();
        await tx.wait();
        return tx.hash;
    }

    /**
     * Check if connected wallet has claimed
     */
    async hasClaimed(address) {
        return await this.contract.hasClaimedAirdrop(address);
    }

    /**
     * Get airdrop statistics
     */
    async getStats() {
        const [totalClaimed, totalUsers, remainingAirdrops, balance] =
            await this.contract.getStats();

        return {
            totalClaimed: ethers.formatEther(totalClaimed),
            totalUsers: totalUsers.toString(),
            remainingAirdrops: remainingAirdrops.toString(),
            balance: ethers.formatEther(balance)
        };
    }

    /**
     * Show airdrop modal on first connection
     */
    async showAirdropModal(address, signer) {
        const hasClaimed = await this.hasClaimed(address);

        if (!hasClaimed) {
            // Show modal to user
            return {
                eligible: true,
                message: '🎉 Claim your 100 IONX welcome bonus!',
                action: async () => await this.claimAirdrop(signer)
            };
        }

        return {
            eligible: false,
            message: 'Airdrop already claimed'
        };
    }
}

// Usage example:
/*
import { AirdropManager } from './IonovaAirdrop';

const airdrop = new AirdropManager(provider);

// On wallet connection
async function onWalletConnect(address, signer) {
  const modal = await airdrop.showAirdropModal(address, signer);
  
  if (modal.eligible) {
    // Show UI modal
    const claim = await modal.action();
    console.log('Airdrop claimed!', claim);
  }
}
*/

// Demo dApp JavaScript

let wallet = null;
let transactions = [];

// Check for Ionova provider
window.addEventListener('load', async () => {
    if (typeof window.ionova !== 'undefined') {
        console.log('✅ Ionova Wallet detected!');
        document.getElementById('walletStatus').textContent = 'Ionova Wallet detected';
    } else {
        document.getElementById('walletStatus').textContent = 'Ionova Wallet not found - Please install the extension';
        document.getElementById('connectBtn').disabled = true;
    }
});

// Connect wallet
document.getElementById('connectBtn').addEventListener('click', async () => {
    if (!window.ionova) {
        alert('Please install Ionova Wallet extension');
        return;
    }

    try {
        const accounts = await window.ionova.getAccounts();

        if (accounts.length === 0) {
            alert('Please create a wallet in the Ionova extension first');
            return;
        }

        wallet = {
            address: accounts[0],
            signatureType: await window.ionova.getSignatureType()
        };

        // Update UI
        document.getElementById('walletStatus').textContent = 'Wallet Connected ✓';
        document.getElementById('address').textContent =
            wallet.address.slice(0, 10) + '...' + wallet.address.slice(-8);
        document.getElementById('sigType').textContent = formatSignatureType(wallet.signatureType);

        // Load balance
        const balanceResult = await window.ionova.getBalance(wallet.address);
        document.getElementById('balance').textContent =
            (balanceResult.balance || 0).toFixed(2) + ' IONX';

        // Show connected UI
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('sendCard').style.display = 'block';
        document.getElementById('txHistory').style.display = 'block';
        document.getElementById('connectBtn').style.display = 'none';

    } catch (error) {
        console.error('Connection error:', error);
        alert('Failed to connect: ' + error.message);
    }
});

// Send transaction
document.getElementById('sendBtn').addEventListener('click', async () => {
    const to = document.getElementById('toAddress').value;
    const amount = document.getElementById('amount').value;

    if (!to || !amount) {
        alert('Please fill all fields');
        return;
    }

    if (!to.startsWith('0x') || to.length !== 42) {
        alert('Invalid address format');
        return;
    }

    try {
        // Convert IONX to wei (18 decimals)
        const amountWei = (parseFloat(amount) * 1e18).toString();

        const result = await window.ionova.sendTransaction({
            to,
            value: amountWei,
            gasLimit: 50000
        });

        // Show result
        document.getElementById('txHash').textContent = result.txHash || 'Pending...';
        document.getElementById('txResult').style.display = 'block';

        // Add to transaction list
        addTransaction({
            hash: result.txHash,
            to,
            amount,
            timestamp: new Date().toISOString()
        });

        // Clear form
        document.getElementById('toAddress').value = '';
        document.getElementById('amount').value = '';

        alert('Transaction sent successfully!');

    } catch (error) {
        console.error('Send error:', error);
        alert('Transaction failed: ' + error.message);
    }
});

function formatSignatureType(type) {
    const names = {
        'ecdsa': 'ECDSA',
        'dilithium': 'Dilithium (PQ)',
        'sphincs': 'SPHINCS+ (PQ)',
        'hybrid': 'Hybrid (ECDSA+PQ)'
    };
    return names[type] || type.toUpperCase();
}

function addTransaction(tx) {
    transactions.unshift(tx);

    const txList = document.getElementById('txList');
    txList.innerHTML = transactions.map(t => `
    <div class="tx-item">
      <strong>Hash:</strong> ${t.hash}<br>
      <strong>To:</strong> ${t.to}<br>
      <strong>Amount:</strong> ${t.amount} IONX<br>
      <strong>Time:</strong> ${new Date(t.timestamp).toLocaleString()}
    </div>
  `).join('');
}

// Demo: Estimate gas for different signature types
async function estimateGasComparison() {
    if (!wallet) return;

    const tx = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '1000000000000000000' // 1 IONX
    };

    const types = ['ecdsa', 'dilithium', 'sphincs', 'hybrid'];
    const estimates = {};

    for (const type of types) {
        try {
            const gas = await window.ionova.estimateGasWithSignature(tx, type);
            estimates[type] = gas;
        } catch (e) {
            console.error(`Failed to estimate for ${type}:`, e);
        }
    }

    console.table(estimates);
    return estimates;
}

// Make demo functions available globally
window.demoFunctions = {
    estimateGasComparison,
    getWalletInfo: () => wallet,
    getTransactions: () => transactions
};

console.log('🚀 Ionova Demo dApp loaded');
console.log('Available demo functions:', Object.keys(window.demoFunctions));

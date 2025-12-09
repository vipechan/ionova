// Browser Extension Popup Script

// Load wallet data
chrome.storage.local.get(['wallet', 'network'], (data) => {
    if (data.wallet) {
        document.getElementById('address').textContent =
            data.wallet.address.slice(0, 10) + '...' + data.wallet.address.slice(-8);
        document.getElementById('sigType').textContent =
            getSignatureName(data.wallet.signatureType);

        // Load balance
        loadBalance(data.wallet.address);
    } else {
        // Show create wallet screen
        showCreateWallet();
    }
});

function getSignatureName(type) {
    const names = {
        'ecdsa': 'ECDSA (Traditional)',
        'dilithium': 'Dilithium (Quantum-Safe)',
        'sphincs': 'SPHINCS+ (Ultra-Secure)',
        'hybrid': 'Hybrid (ECDSA+PQ)'
    };
    return names[type] || 'Unknown';
}

async function loadBalance(address) {
    try {
        const response = await fetch('http://localhost:27000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            })
        });

        const data = await response.json();
        const balance = parseInt(data.result, 16) / 1e18;
        document.getElementById('balance').textContent = balance.toFixed(2);
    } catch (error) {
        console.error('Failed to load balance:', error);
    }
}

// Send button
document.getElementById('sendBtn')?.addEventListener('click', () => {
    // Open send transaction page
    chrome.tabs.create({ url: 'send.html' });
});

// Receive button
document.getElementById('receiveBtn')?.addEventListener('click', () => {
    chrome.storage.local.get(['wallet'], (data) => {
        if (data.wallet) {
            // Copy address to clipboard
            navigator.clipboard.writeText(data.wallet.address);
            alert('Address copied to clipboard!');
        }
    });
});

function showCreateWallet() {
    document.querySelector('.container').innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 48px; margin-bottom: 20px;">⚛️</div>
      <h2 style="margin-bottom: 10px;">Welcome to Ionova</h2>
      <p style="opacity: 0.8; margin-bottom: 30px;">Quantum-Safe Blockchain Wallet</p>
      <button class="btn btn-primary" style="width: 100%;" onclick="createWallet()">
        Create Wallet
      </button>
    </div>
  `;
}

function createWallet() {
    // In production, this would use the wallet SDK
    const wallet = {
        address: '0x' + Array(40).fill(0).map(() =>
            Math.floor(Math.random() * 16).toString(16)).join(''),
        signatureType: 'dilithium',
        privateKey: 'encrypted_private_key_here'
    };

    chrome.storage.local.set({ wallet }, () => {
        location.reload();
    });
}

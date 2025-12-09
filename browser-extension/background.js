// Background Service Worker for Ionova Wallet

console.log('Ionova Wallet background script loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Ionova Wallet installed');

    // Set default network
    chrome.storage.local.set({
        network: {
            name: 'Ionova Testnet',
            rpcUrl: 'http://localhost:27000',
            chainId: 31337
        }
    });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_WALLET') {
        chrome.storage.local.get(['wallet'], (data) => {
            sendResponse({ wallet: data.wallet });
        });
        return true;
    }

    if (request.type === 'SIGN_TRANSACTION') {
        handleSignTransaction(request.transaction)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (request.type === 'GET_BALANCE') {
        getBalance(request.address)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

async function handleSignTransaction(transaction) {
    // Get wallet from storage
    const { wallet } = await chrome.storage.local.get(['wallet']);

    if (!wallet) {
        throw new Error('No wallet found');
    }

    // In production, sign the transaction with the appropriate signature type
    // For now, return a mock signed transaction
    return {
        signed: true,
        txHash: '0x' + Array(64).fill(0).map(() =>
            Math.floor(Math.random() * 16).toString(16)).join('')
    };
}

async function getBalance(address) {
    const { network } = await chrome.storage.local.get(['network']);

    const response = await fetch(network.rpcUrl, {
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
    return {
        balance: parseInt(data.result, 16) / 1e18
    };
}

// Keep service worker alive
setInterval(() => {
    console.log('Ionova Wallet heartbeat');
}, 20000);

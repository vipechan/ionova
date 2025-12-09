// Inpage Script - Provides window.ionova API

(function () {
    let requestId = 0;
    const pendingRequests = new Map();

    // Create Ionova Provider
    window.ionova = {
        isIonova: true,
        version: '1.0.0',

        async request(args) {
            const id = ++requestId;

            return new Promise((resolve, reject) => {
                pendingRequests.set(id, { resolve, reject });

                window.postMessage({
                    type: 'IONOVA_' + args.method.toUpperCase(),
                    id,
                    payload: args.params || []
                }, '*');

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (pendingRequests.has(id)) {
                        pendingRequests.delete(id);
                        reject(new Error('Request timeout'));
                    }
                }, 30000);
            });
        },

        // Ethereum-compatible API
        async enable() {
            return this.request({ method: 'eth_requestAccounts' });
        },

        async getAccounts() {
            const wallet = await this.request({ method: 'get_wallet' });
            return wallet ? [wallet.address] : [];
        },

        async getBalance(address) {
            return this.request({
                method: 'get_balance',
                params: [address]
            });
        },

        async sendTransaction(tx) {
            return this.request({
                method: 'sign_transaction',
                params: [tx]
            });
        },

        async getSignatureType() {
            const wallet = await this.request({ method: 'get_wallet' });
            return wallet?.signatureType || 'ecdsa';
        },

        // Quantum-safe specific API
        async createQuantumWallet(type = 'dilithium') {
            return this.request({
                method: 'create_wallet',
                params: [type]
            });
        },

        async estimateGasWithSignature(tx, signatureType) {
            return this.request({
                method: 'estimate_gas',
                params: [tx, signatureType]
            });
        }
    };

    // Listen for responses
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type !== 'IONOVA_RESPONSE') return;

        const { id, result } = event.data;
        const pending = pendingRequests.get(id);

        if (pending) {
            pendingRequests.delete(id);
            if (result.error) {
                pending.reject(new Error(result.error));
            } else {
                pending.resolve(result);
            }
        }
    });

    // Dispatch ready event
    window.dispatchEvent(new Event('ionova#initialized'));

    console.log('⚛️ Ionova Provider injected');
})();

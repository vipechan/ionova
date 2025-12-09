/**
 * Ionova Quantum-Safe Wallet SDK
 * 
 * JavaScript/TypeScript SDK for building wallets with post-quantum signature support
 */

import { secp256k1 } from '@noble/secp256k1';
// import { dilithium, sphincs, falcon } from '@noble/post-quantum'; // When available

export enum SignatureType {
    ECDSA = 'ecdsa',
    Dilithium = 'dilithium',
    SPHINCSPlus = 'sphincsplus',
    Falcon = 'falcon',
    Hybrid = 'hybrid',
}

export interface Transaction {
    from?: string;
    to: string;
    value: string;
    nonce?: number;
    gasLimit?: number;
    gasPrice?: string;
    data?: string;
}

export interface SignedTransaction extends Transaction {
    signature: Signature;
    publicKey: string;
    hash: string;
}

export interface Signature {
    type: SignatureType;
    data: string; // Hex-encoded signature
}

export interface TransactionReceipt {
    transactionHash: string;
    blockNumber: number;
    status: number;
    gasUsed: number;
}

/**
 * Ionova Wallet with multi-signature support
 */
export class IonovaWallet {
    private privateKey: Uint8Array;
    private publicKey: Uint8Array;
    public readonly address: string;
    public readonly signatureType: SignatureType;
    private provider: any; // RPC provider

    private constructor(
        privateKey: Uint8Array,
        publicKey: Uint8Array,
        address: string,
        signatureType: SignatureType,
        provider?: any
    ) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.address = address;
        this.signatureType = signatureType;
        this.provider = provider;
    }

    /**
     * Create a new ECDSA wallet (compatible with MetaMask)
     */
    static createECDSA(provider?: any): IonovaWallet {
        const privateKey = secp256k1.utils.randomPrivateKey();
        const publicKey = secp256k1.getPublicKey(privateKey, true);
        const address = this.deriveAddress(publicKey, SignatureType.ECDSA);

        return new IonovaWallet(
            privateKey,
            publicKey,
            address,
            SignatureType.ECDSA,
            provider
        );
    }

    /**
     * Create a quantum-safe Dilithium wallet
     */
    static createDilithium(provider?: any): IonovaWallet {
        // Generate Dilithium keypair
        // Note: Actual implementation would use @noble/post-quantum when available
        const privateKey = crypto.getRandomValues(new Uint8Array(64));
        const publicKey = crypto.getRandomValues(new Uint8Array(2528)); // Dilithium public key size
        const address = this.deriveAddress(publicKey, SignatureType.Dilithium);

        return new IonovaWallet(
            privateKey,
            publicKey,
            address,
            SignatureType.Dilithium,
            provider
        );
    }

    /**
     * Create a hybrid wallet (ECDSA + Dilithium)
     */
    static createHybrid(provider?: any): IonovaWallet {
        // Generate both key pairs
        const ecdsaKey = secp256k1.utils.randomPrivateKey();
        const ecdsaPublicKey = secp256k1.getPublicKey(ecdsaKey, true);

        // For hybrid, we use ECDSA address for compatibility
        const address = this.deriveAddress(ecdsaPublicKey, SignatureType.ECDSA);

        return new IonovaWallet(
            ecdsaKey,
            ecdsaPublicKey,
            address,
            SignatureType.Hybrid,
            provider
        );
    }

    /**
     * Import wallet from private key
     */
    static fromPrivateKey(
        privateKeyHex: string,
        type: SignatureType,
        provider?: any
    ): IonovaWallet {
        const privateKey = hexToBytes(privateKeyHex);

        switch (type) {
            case SignatureType.ECDSA:
                const publicKey = secp256k1.getPublicKey(privateKey, true);
                const address = this.deriveAddress(publicKey, type);
                return new IonovaWallet(privateKey, publicKey, address, type, provider);

            // Other types would be implemented similarly
            default:
                throw new Error(`Unsupported signature type: ${type}`);
        }
    }

    /**
     * Sign a transaction
     */
    async signTransaction(tx: Transaction): Promise<SignedTransaction> {
        // Auto-fill missing fields
        const completeTx = {
            from: this.address,
            ...tx,
            nonce: tx.nonce ?? await this.getNonce(),
            gasLimit: tx.gasLimit ?? this.estimateGasLimit(this.signatureType),
            gasPrice: tx.gasPrice ?? '0.000001',
        };

        // Create transaction hash
        const txHash = this.hashTransaction(completeTx);

        // Sign based on signature type
        let signature: Signature;

        switch (this.signatureType) {
            case SignatureType.ECDSA:
                signature = await this.signECDSA(txHash);
                break;

            case SignatureType.Dilithium:
                signature = await this.signDilithium(txHash);
                break;

            case SignatureType.Hybrid:
                signature = await this.signHybrid(txHash);
                break;

            default:
                throw new Error(`Unsupported signature type: ${this.signatureType}`);
        }

        return {
            ...completeTx,
            signature,
            publicKey: bytesToHex(this.publicKey),
            hash: bytesToHex(txHash),
        };
    }

    /**
     * Send a signed transaction to the network
     */
    async sendTransaction(signedTx: SignedTransaction): Promise<TransactionReceipt> {
        if (!this.provider) {
            throw new Error('Provider not configured');
        }

        // Send via RPC
        const response = await this.provider.send('eth_sendRawTransaction', [signedTx]);

        // Wait for confirmation
        const receipt = await this.provider.waitForTransaction(response);

        return receipt;
    }

    /**
     * Get wallet balance
     */
    async getBalance(): Promise<string> {
        if (!this.provider) {
            throw new Error('Provider not configured');
        }

        const balance = await this.provider.getBalance(this.address);
        return balance.toString();
    }

    /**
     * Estimate gas for transaction
     */
    async estimateGas(tx: Transaction): Promise<number> {
        const baseGas = 21000;

        // Add signature verification cost
        const sigGas = this.getSignatureGas(this.signatureType);

        // Add data cost
        const dataGas = (tx.data?.length ?? 0) * 16;

        return baseGas + sigGas + dataGas;
    }

    // Private helper methods

    private async signECDSA(messageHash: Uint8Array): Promise<Signature> {
        const sig = await secp256k1.sign(messageHash, this.privateKey);
        return {
            type: SignatureType.ECDSA,
            data: bytesToHex(sig.toCompactRawBytes()),
        };
    }

    private async signDilithium(messageHash: Uint8Array): Promise<Signature> {
        // Placeholder - actual implementation would use Dilithium library
        const sig = new Uint8Array(2420); // Dilithium signature size
        crypto.getRandomValues(sig);

        return {
            type: SignatureType.Dilithium,
            data: bytesToHex(sig),
        };
    }

    private async signHybrid(messageHash: Uint8Array): Promise<Signature> {
        const ecdsaSig = await this.signECDSA(messageHash);
        const dilithiumSig = await this.signDilithium(messageHash);

        return {
            type: SignatureType.Hybrid,
            data: JSON.stringify({
                ecdsa: ecdsaSig.data,
                pq: dilithiumSig.data,
            }),
        };
    }

    private hashTransaction(tx: Transaction): Uint8Array {
        const txString = JSON.stringify({
            from: tx.from,
            to: tx.to,
            value: tx.value,
            nonce: tx.nonce,
            gasLimit: tx.gasLimit,
            gasPrice: tx.gasPrice,
            data: tx.data,
        });

        return secp256k1.utils.sha256(new TextEncoder().encode(txString));
    }

    private async getNonce(): Promise<number> {
        if (!this.provider) {
            return 0;
        }
        return await this.provider.getTransactionCount(this.address);
    }

    private estimateGasLimit(type: SignatureType): number {
        return 21000 + this.getSignatureGas(type);
    }

    private getSignatureGas(type: SignatureType): number {
        switch (type) {
            case SignatureType.ECDSA:
                return 3000;
            case SignatureType.Dilithium:
                return 25000; // Subsidized (actual: 50,000)
            case SignatureType.SPHINCSPlus:
                return 35000; // Subsidized (actual: 70,000)
            case SignatureType.Falcon:
                return 17500; // Subsidized (actual: 35,000)
            case SignatureType.Hybrid:
                return 7000; // 3k ECDSA + 4k PQ
            default:
                return 3000;
        }
    }

    private static deriveAddress(publicKey: Uint8Array, type: SignatureType): string {
        if (type === SignatureType.ECDSA || type === SignatureType.Hybrid) {
            // EVM-style address (Keccak256 hash, last 20 bytes)
            const hash = secp256k1.utils.sha256(publicKey);
            const address = hash.slice(-20);
            return '0x' + bytesToHex(address);
        } else {
            // Native ionova address (hash of public key)
            const hash = secp256k1.utils.sha256(publicKey);
            return 'ionova1' + bytesToHex(hash).slice(0, 40);
        }
    }
}

// Utility functions

function hexToBytes(hex: string): Uint8Array {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Export utilities
export const utils = {
    hexToBytes,
    bytesToHex,
    evmToNative: (evmAddress: string): string => {
        return 'ionova1' + evmAddress.slice(2).slice(0, 40);
    },
    nativeToEvm: (nativeAddress: string): string => {
        return '0x' + nativeAddress.slice(7);
    },
};

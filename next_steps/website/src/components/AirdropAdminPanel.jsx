import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { ethers } from 'ethers';

const AIRDROP_ADDRESS = import.meta.env.VITE_AIRDROP_ADDRESS;

export default function AirdropAdminPanel() {
    const [formData, setFormData] = useState({
        name: '',
        tokenAddress: '',
        totalAmount: '',
        startTime: '',
        endTime: '',
        vestingDuration: '0',
        cliffPeriod: '0',
        recipientsFile: null,
    });

    const [merkleRoot, setMerkleRoot] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [merkleTree, setMerkleTree] = useState(null);

    // Create airdrop
    const { writeContract: createAirdropWrite, data: createTxHash, isPending: isCreating } = useWriteContract();

    const createAirdrop = ({ args }) => {
        createAirdropWrite({
            address: AIRDROP_ADDRESS,
            abi: [{
                "inputs": [
                    { "internalType": "bytes32", "name": "_merkleRoot", "type": "bytes32" },
                    { "internalType": "address", "name": "_tokenAddress", "type": "address" },
                    { "internalType": "uint256", "name": "_totalAmount", "type": "uint256" },
                    { "internalType": "uint256", "name": "_startTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "_endTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "_vestingDuration", "type": "uint256" },
                    { "internalType": "uint256", "name": "_cliffPeriod", "type": "uint256" },
                    { "internalType": "string", "name": "_name", "type": "string" }
                ],
                "name": "createAirdrop",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "nonpayable",
                "type": "function"
            }],
            functionName: 'createAirdrop',
            args
        });
    };

    const { isSuccess: createSuccess } = useWaitForTransactionReceipt({
        hash: createTxHash,
    });

    // Handle CSV file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const parsed = [];

            for (let i = 1; i < lines.length; i++) {
                const [address, amount] = lines[i].split(',');
                if (address && amount) {
                    parsed.push({
                        address: address.trim(),
                        amount: parseEther(amount.trim()).toString(),
                    });
                }
            }

            setRecipients(parsed);
            generateMerkleTree(parsed);
        };

        reader.readAsText(file);
    };

    // Generate merkle tree
    const generateMerkleTree = (recipientsList) => {
        const leaves = recipientsList.map(r =>
            keccak256(
                ethers.utils.solidityPack(['address', 'uint256'], [r.address, r.amount])
            )
        );

        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = tree.getHexRoot();

        setMerkleTree(tree);
        setMerkleRoot(root);

        // Save tree data for proof generation
        localStorage.setItem(`merkle_tree_${Date.now()}`, JSON.stringify({
            recipients: recipientsList,
            root,
        }));
    };

    // Handle create airdrop
    const handleCreate = () => {
        if (!merkleRoot || !formData.tokenAddress || !formData.totalAmount) {
            alert('Please fill all required fields and upload recipients');
            return;
        }

        const startTimestamp = Math.floor(new Date(formData.startTime).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(formData.endTime).getTime() / 1000);

        createAirdrop({
            args: [
                merkleRoot,
                formData.tokenAddress,
                parseEther(formData.totalAmount),
                startTimestamp,
                endTimestamp,
                parseInt(formData.vestingDuration) * 86400, // Convert days to seconds
                parseInt(formData.cliffPeriod) * 86400,
                formData.name,
            ],
        });
    };

    return (
        <div className="admin-panel">
            <div className="panel-header">
                <h2>🎯 Airdrop Admin Panel</h2>
                <p>Create and manage token airdrops</p>
            </div>

            {createSuccess && (
                <div className="success-banner">
                    ✅ Airdrop created successfully! Merkle root: {merkleRoot.slice(0, 10)}...
                </div>
            )}

            <div className="admin-form">
                {/* Step 1: Basic Info */}
                <div className="form-section">
                    <h3>📝 Step 1: Basic Information</h3>

                    <div className="form-group">
                        <label>Airdrop Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Early Adopter Rewards"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Token Address</label>
                        <input
                            type="text"
                            placeholder="0x..."
                            value={formData.tokenAddress}
                            onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Total Allocation</label>
                        <input
                            type="number"
                            placeholder="1000000"
                            value={formData.totalAmount}
                            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                            className="form-input"
                        />
                    </div>
                </div>

                {/* Step 2: Timing */}
                <div className="form-section">
                    <h3>⏰ Step 2: Timing</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Vesting Duration (days)</label>
                            <input
                                type="number"
                                placeholder="0 for instant"
                                value={formData.vestingDuration}
                                onChange={(e) => setFormData({ ...formData, vestingDuration: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cliff Period (days)</label>
                            <input
                                type="number"
                                placeholder="0 for no cliff"
                                value={formData.cliffPeriod}
                                onChange={(e) => setFormData({ ...formData, cliffPeriod: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 3: Recipients */}
                <div className="form-section">
                    <h3>👥 Step 3: Upload Recipients</h3>

                    <div className="upload-zone">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="file-input"
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="upload-label">
                            <div className="upload-icon">📄</div>
                            <div>Click to upload CSV file</div>
                            <div className="upload-hint">Format: address,amount</div>
                        </label>
                    </div>

                    {recipients.length > 0 && (
                        <div className="recipients-summary">
                            <div className="summary-header">
                                ✅ {recipients.length} recipients loaded
                            </div>
                            <div className="summary-details">
                                <div>Merkle Root: <code>{merkleRoot.slice(0, 20)}...</code></div>
                                <div>Total Amount: {formData.totalAmount} tokens</div>
                            </div>

                            <div className="recipients-preview">
                                <h4>Preview (first 5):</h4>
                                {recipients.slice(0, 5).map((r, i) => (
                                    <div key={i} className="recipient-row">
                                        <span>{r.address.slice(0, 10)}...</span>
                                        <span>{formatEther(r.amount)} tokens</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Button */}
                <button
                    className="btn btn-primary btn-large"
                    onClick={handleCreate}
                    disabled={isCreating || !merkleRoot}
                >
                    {isCreating ? (
                        <>
                            <span className="spinner"></span>
                            Creating Airdrop...
                        </>
                    ) : (
                        <>🚀 Create Airdrop</>
                    )}
                </button>
            </div>

            {/* Instructions */}
            <div className="instructions-section">
                <h3>📚 CSV Format Instructions</h3>
                <div className="code-block">
                    <code>
                        address,amount<br />
                        0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,1000<br />
                        0x123d35Cc6634C0532925a3b844Bc9e7595f0abc,500<br />
                        0x456d35Cc6634C0532925a3b844Bc9e7595f0def,250
                    </code>
                </div>
            </div>
        </div>
    );
}

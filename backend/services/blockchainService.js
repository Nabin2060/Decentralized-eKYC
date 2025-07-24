const { ethers } = require('ethers');

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        this.privateKey = process.env.ETHEREUM_PRIVATE_KEY;
        this.contractAddress = process.env.SMART_CONTRACT_ADDRESS;

        if (this.privateKey) {
            this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        }
    }

    // Get wallet address
    getWalletAddress() {
        return this.wallet ? this.wallet.address : null;
    }

    // Get network information
    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();

            return {
                chainId: network.chainId,
                name: network.name,
                blockNumber,
                gasPrice: gasPrice.gasPrice?.toString()
            };
        } catch (error) {
            console.error('Failed to get network info:', error);
            throw new Error('Failed to get blockchain network information');
        }
    }

    // Get account balance
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw new Error('Failed to get account balance');
        }
    }

    // Store credential hash on blockchain
    async storeCredentialHash(credentialId, ipfsHash, holderAddress) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not configured');
            }

            // Simple credential storage contract ABI
            const contractABI = [
                "function storeCredential(string credentialId, string ipfsHash, address holder) external",
                "function getCredential(string credentialId) external view returns (string ipfsHash, address holder, uint256 timestamp)",
                "function revokeCredential(string credentialId) external",
                "event CredentialStored(string credentialId, string ipfsHash, address holder, uint256 timestamp)",
                "event CredentialRevoked(string credentialId, uint256 timestamp)"
            ];

            const contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

            const tx = await contract.storeCredential(credentialId, ipfsHash, holderAddress);
            const receipt = await tx.wait();

            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Failed to store credential on blockchain:', error);
            throw new Error('Failed to store credential hash on blockchain');
        }
    }

    // Retrieve credential hash from blockchain
    async getCredentialHash(credentialId) {
        try {
            const contractABI = [
                "function getCredential(string credentialId) external view returns (string ipfsHash, address holder, uint256 timestamp)"
            ];

            const contract = new ethers.Contract(this.contractAddress, contractABI, this.provider);

            const result = await contract.getCredential(credentialId);

            return {
                ipfsHash: result[0],
                holder: result[1],
                timestamp: new Date(parseInt(result[2]) * 1000)
            };
        } catch (error) {
            console.error('Failed to get credential from blockchain:', error);
            throw new Error('Failed to retrieve credential hash from blockchain');
        }
    }

    // Revoke credential on blockchain
    async revokeCredential(credentialId) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not configured');
            }

            const contractABI = [
                "function revokeCredential(string credentialId) external"
            ];

            const contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

            const tx = await contract.revokeCredential(credentialId);
            const receipt = await tx.wait();

            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Failed to revoke credential on blockchain:', error);
            throw new Error('Failed to revoke credential on blockchain');
        }
    }

    // Store consent hash on blockchain
    async storeConsentHash(consentId, ipfsHash, dataSubjectAddress, dataControllerAddress) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not configured');
            }

            // Simple consent storage contract ABI
            const contractABI = [
                "function storeConsent(string consentId, string ipfsHash, address dataSubject, address dataController) external",
                "function getConsent(string consentId) external view returns (string ipfsHash, address dataSubject, address dataController, uint256 timestamp)",
                "function revokeConsent(string consentId) external",
                "event ConsentStored(string consentId, string ipfsHash, address dataSubject, address dataController, uint256 timestamp)",
                "event ConsentRevoked(string consentId, uint256 timestamp)"
            ];

            const contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

            const tx = await contract.storeConsent(consentId, ipfsHash, dataSubjectAddress, dataControllerAddress);
            const receipt = await tx.wait();

            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Failed to store consent on blockchain:', error);
            throw new Error('Failed to store consent hash on blockchain');
        }
    }

    // Get transaction details
    async getTransactionDetails(txHash) {
        try {
            const tx = await this.provider.getTransaction(txHash);
            const receipt = await this.provider.getTransactionReceipt(txHash);

            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                gasPrice: tx.gasPrice.toString(),
                gasLimit: tx.gasLimit.toString(),
                nonce: tx.nonce,
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed.toString(),
                status: receipt?.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Failed to get transaction details:', error);
            throw new Error('Failed to get transaction details');
        }
    }

    // Estimate gas for transaction
    async estimateGas(credentialId, ipfsHash, holderAddress) {
        try {
            const contractABI = [
                "function storeCredential(string credentialId, string ipfsHash, address holder) external"
            ];

            const contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);

            const gasEstimate = await contract.storeCredential.estimateGas(credentialId, ipfsHash, holderAddress);

            return {
                gasEstimate: gasEstimate.toString(),
                gasPrice: (await this.provider.getFeeData()).gasPrice?.toString()
            };
        } catch (error) {
            console.error('Failed to estimate gas:', error);
            throw new Error('Failed to estimate gas for transaction');
        }
    }

    // Check if wallet is connected
    isWalletConnected() {
        return !!this.wallet;
    }

    // Get wallet info
    getWalletInfo() {
        if (!this.wallet) {
            return null;
        }

        return {
            address: this.wallet.address,
            privateKey: this.wallet.privateKey,
            publicKey: this.wallet.publicKey
        };
    }
}

module.exports = new BlockchainService(); 
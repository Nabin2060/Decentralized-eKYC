const { create } = require('ipfs-http-client');

class IPFSService {
    constructor() {
        this.ipfs = create({
            url: process.env.IPFS_API_URL || 'http://localhost:5001'
        });
        this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    }

    // Upload data to IPFS
    async uploadToIPFS(data) {
        try {
            const dataBuffer = Buffer.from(JSON.stringify(data));
            const result = await this.ipfs.add(dataBuffer);

            return {
                hash: result.cid.toString(),
                url: `${this.gatewayUrl}${result.cid.toString()}`,
                size: result.size
            };
        } catch (error) {
            console.error('IPFS upload error:', error);
            throw new Error('Failed to upload data to IPFS');
        }
    }

    // Upload file to IPFS
    async uploadFile(fileBuffer, filename) {
        try {
            const file = {
                path: filename,
                content: fileBuffer
            };

            const result = await this.ipfs.add(file);

            return {
                hash: result.cid.toString(),
                url: `${this.gatewayUrl}${result.cid.toString()}`,
                filename: filename,
                size: result.size
            };
        } catch (error) {
            console.error('IPFS file upload error:', error);
            throw new Error('Failed to upload file to IPFS');
        }
    }

    // Retrieve data from IPFS
    async getFromIPFS(hash) {
        try {
            const chunks = [];
            for await (const chunk of this.ipfs.cat(hash)) {
                chunks.push(chunk);
            }

            const data = Buffer.concat(chunks);
            return JSON.parse(data.toString());
        } catch (error) {
            console.error('IPFS retrieval error:', error);
            throw new Error('Failed to retrieve data from IPFS');
        }
    }

    // Pin content to IPFS
    async pinContent(hash) {
        try {
            await this.ipfs.pin.add(hash);
            return { success: true, hash };
        } catch (error) {
            console.error('IPFS pin error:', error);
            throw new Error('Failed to pin content to IPFS');
        }
    }

    // Unpin content from IPFS
    async unpinContent(hash) {
        try {
            await this.ipfs.pin.rm(hash);
            return { success: true, hash };
        } catch (error) {
            console.error('IPFS unpin error:', error);
            throw new Error('Failed to unpin content from IPFS');
        }
    }

    // Check if IPFS is connected
    async isConnected() {
        try {
            const version = await this.ipfs.version();
            return !!version;
        } catch (error) {
            console.error('IPFS connection check failed:', error);
            return false;
        }
    }

    // Get IPFS node info
    async getNodeInfo() {
        try {
            const version = await this.ipfs.version();
            const id = await this.ipfs.id();

            return {
                version: version.version,
                nodeId: id.id,
                addresses: id.addresses,
                agentVersion: id.agentVersion,
                protocolVersion: id.protocolVersion
            };
        } catch (error) {
            console.error('Failed to get IPFS node info:', error);
            throw new Error('Failed to get IPFS node information');
        }
    }

    // Upload credential data with metadata
    async uploadCredential(credentialData, metadata = {}) {
        try {
            const dataToUpload = {
                credential: credentialData,
                metadata: {
                    ...metadata,
                    uploadedAt: new Date().toISOString(),
                    version: '1.0'
                }
            };

            return await this.uploadToIPFS(dataToUpload);
        } catch (error) {
            console.error('Credential upload error:', error);
            throw new Error('Failed to upload credential to IPFS');
        }
    }

    // Upload consent data
    async uploadConsent(consentData, metadata = {}) {
        try {
            const dataToUpload = {
                consent: consentData,
                metadata: {
                    ...metadata,
                    uploadedAt: new Date().toISOString(),
                    version: '1.0'
                }
            };

            return await this.uploadToIPFS(dataToUpload);
        } catch (error) {
            console.error('Consent upload error:', error);
            throw new Error('Failed to upload consent to IPFS');
        }
    }
}

module.exports = new IPFSService(); 
const Credential = require('../models/Credential');
const User = require('../models/User');
const ipfsService = require('../services/ipfsService');
const blockchainService = require('../services/blockchainService');
const didService = require('../services/didService');

class CredentialController {
    // Issue a new credential
    async issueCredential(req, res) {
        try {
            const { holderId, type, credentialSubject, expirationDate, metadata } = req.body;
            const issuerId = req.user._id;

            // Check if issuer has permission
            if (!['issuer', 'admin'].includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Only issuers and admins can issue credentials'
                });
            }

            // Verify holder exists
            const holder = await User.findById(holderId);
            if (!holder) {
                return res.status(404).json({
                    error: 'Holder not found'
                });
            }

            // Get issuer details
            const issuer = await User.findById(issuerId);
            if (!issuer) {
                return res.status(404).json({
                    error: 'Issuer not found'
                });
            }

            // Create Verifiable Credential
            const vc = await didService.createVerifiableCredential(
                issuer.did || `did:ethr:${issuer._id}`,
                holder.did || `did:ethr:${holder._id}`,
                credentialSubject,
                {
                    type: [type, 'VerifiableCredential'],
                    expirationDate,
                    id: `urn:uuid:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }
            );

            // Sign the credential (if issuer has private key)
            let signedCredential = null;
            try {
                signedCredential = await didService.signCredential(vc, issuer.publicKey);
            } catch (error) {
                console.warn('Failed to sign credential, continuing without signature:', error.message);
            }

            // Upload to IPFS
            let ipfsData = null;
            try {
                ipfsData = await ipfsService.uploadCredential(
                    signedCredential || vc,
                    {
                        issuerId: issuer._id,
                        holderId: holder._id,
                        type,
                        ...metadata
                    }
                );
            } catch (error) {
                console.warn('Failed to upload to IPFS, continuing without IPFS storage:', error.message);
            }

            // Store on blockchain
            let blockchainData = null;
            if (ipfsData && blockchainService.isWalletConnected()) {
                try {
                    blockchainData = await blockchainService.storeCredentialHash(
                        vc.id,
                        ipfsData.hash,
                        holder.did || holder._id.toString()
                    );
                } catch (error) {
                    console.warn('Failed to store on blockchain, continuing without blockchain storage:', error.message);
                }
            }

            // Create credential record
            const credential = new Credential({
                credentialId: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                holderId,
                issuerId,
                type,
                vc: signedCredential ? { ...vc, proof: { jwt: signedCredential } } : vc,
                ipfsHash: ipfsData?.hash,
                ipfsUrl: ipfsData?.url,
                blockchainTxHash: blockchainData?.transactionHash,
                blockchainBlockNumber: blockchainData?.blockNumber,
                metadata: {
                    description: metadata?.description,
                    tags: metadata?.tags || [],
                    category: metadata?.category,
                    version: '1.0'
                }
            });

            await credential.save();

            res.status(201).json({
                message: 'Credential issued successfully',
                credential: {
                    id: credential._id,
                    credentialId: credential.credentialId,
                    type: credential.type,
                    status: credential.status,
                    holder: {
                        id: holder._id,
                        username: holder.username,
                        did: holder.did
                    },
                    issuer: {
                        id: issuer._id,
                        username: issuer.username,
                        did: issuer.did
                    },
                    issuedAt: credential.issuedAt,
                    expirationDate: credential.vc.expirationDate,
                    ipfsHash: credential.ipfsHash,
                    ipfsUrl: credential.ipfsUrl,
                    blockchainTxHash: credential.blockchainTxHash,
                    metadata: credential.metadata
                }
            });
        } catch (error) {
            console.error('Issue credential error:', error);
            res.status(500).json({
                error: 'Failed to issue credential',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get user credentials
    async getUserCredentials(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10, status, type } = req.query;

            // Check if user has permission to view these credentials
            if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
                return res.status(403).json({
                    error: 'Access denied. You can only view your own credentials.'
                });
            }

            const query = { holderId: id };

            if (status) {
                query.status = status;
            }

            if (type) {
                query.type = type;
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                populate: [
                    { path: 'issuerId', select: 'username email did' },
                    { path: 'holderId', select: 'username email did' }
                ],
                sort: { issuedAt: -1 }
            };

            const credentials = await Credential.paginate(query, options);

            res.json({
                credentials: credentials.docs.map(cred => ({
                    id: cred._id,
                    credentialId: cred.credentialId,
                    type: cred.type,
                    status: cred.status,
                    issuer: cred.issuerId,
                    holder: cred.holderId,
                    issuedAt: cred.issuedAt,
                    expirationDate: cred.vc.expirationDate,
                    ipfsHash: cred.ipfsHash,
                    ipfsUrl: cred.ipfsUrl,
                    blockchainTxHash: cred.blockchainTxHash,
                    metadata: cred.metadata,
                    isValid: cred.isValid()
                })),
                pagination: {
                    page: credentials.page,
                    limit: credentials.limit,
                    totalDocs: credentials.totalDocs,
                    totalPages: credentials.totalPages,
                    hasNextPage: credentials.hasNextPage,
                    hasPrevPage: credentials.hasPrevPage
                }
            });
        } catch (error) {
            console.error('Get user credentials error:', error);
            res.status(500).json({
                error: 'Failed to get user credentials',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get credential by ID
    async getCredential(req, res) {
        try {
            const { credentialId } = req.params;

            const credential = await Credential.findOne({ credentialId })
                .populate('issuerId', 'username email did')
                .populate('holderId', 'username email did');

            if (!credential) {
                return res.status(404).json({
                    error: 'Credential not found'
                });
            }

            // Check if user has permission to view this credential
            if (req.user.role !== 'admin' &&
                req.user._id.toString() !== credential.holderId._id.toString() &&
                req.user._id.toString() !== credential.issuerId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. You can only view credentials you own or issued.'
                });
            }

            res.json({
                credential: {
                    id: credential._id,
                    credentialId: credential.credentialId,
                    type: credential.type,
                    status: credential.status,
                    issuer: credential.issuerId,
                    holder: credential.holderId,
                    vc: credential.vc,
                    issuedAt: credential.issuedAt,
                    revokedAt: credential.revokedAt,
                    ipfsHash: credential.ipfsHash,
                    ipfsUrl: credential.ipfsUrl,
                    blockchainTxHash: credential.blockchainTxHash,
                    metadata: credential.metadata,
                    isValid: credential.isValid()
                }
            });
        } catch (error) {
            console.error('Get credential error:', error);
            res.status(500).json({
                error: 'Failed to get credential',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Revoke credential
    async revokeCredential(req, res) {
        try {
            const { credentialId, reason } = req.body;
            const revokerId = req.user._id;

            const credential = await Credential.findOne({ credentialId })
                .populate('issuerId', 'username email did')
                .populate('holderId', 'username email did');

            if (!credential) {
                return res.status(404).json({
                    error: 'Credential not found'
                });
            }

            // Check if user has permission to revoke this credential
            if (req.user.role !== 'admin' &&
                req.user._id.toString() !== credential.issuerId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. Only the issuer or admin can revoke credentials.'
                });
            }

            if (credential.status === 'revoked') {
                return res.status(400).json({
                    error: 'Credential is already revoked'
                });
            }

            // Revoke on blockchain
            let blockchainData = null;
            if (blockchainService.isWalletConnected()) {
                try {
                    blockchainData = await blockchainService.revokeCredential(credentialId);
                } catch (error) {
                    console.warn('Failed to revoke on blockchain, continuing with local revocation:', error.message);
                }
            }

            // Revoke locally
            await credential.revoke(revokerId, reason);

            res.json({
                message: 'Credential revoked successfully',
                credential: {
                    id: credential._id,
                    credentialId: credential.credentialId,
                    status: credential.status,
                    revokedAt: credential.revokedAt,
                    revokedBy: revokerId,
                    revocationReason: credential.revocationReason,
                    blockchainTxHash: blockchainData?.transactionHash
                }
            });
        } catch (error) {
            console.error('Revoke credential error:', error);
            res.status(500).json({
                error: 'Failed to revoke credential',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Verify credential
    async verifyCredential(req, res) {
        try {
            const { credentialId } = req.params;

            const credential = await Credential.findOne({ credentialId });
            if (!credential) {
                return res.status(404).json({
                    error: 'Credential not found'
                });
            }

            // Verify on blockchain if available
            let blockchainVerification = null;
            if (credential.blockchainTxHash && blockchainService.isWalletConnected()) {
                try {
                    const blockchainData = await blockchainService.getCredentialHash(credentialId);
                    blockchainVerification = {
                        verified: blockchainData.ipfsHash === credential.ipfsHash,
                        blockchainData
                    };
                } catch (error) {
                    console.warn('Blockchain verification failed:', error.message);
                }
            }

            // Verify DID signature if available
            let didVerification = null;
            if (credential.vc.proof?.jwt) {
                try {
                    didVerification = await didService.verifyCredential(credential.vc.proof.jwt);
                } catch (error) {
                    console.warn('DID verification failed:', error.message);
                }
            }

            res.json({
                credentialId,
                verification: {
                    isValid: credential.isValid(),
                    status: credential.status,
                    blockchainVerification,
                    didVerification,
                    issuedAt: credential.issuedAt,
                    revokedAt: credential.revokedAt,
                    ipfsHash: credential.ipfsHash,
                    blockchainTxHash: credential.blockchainTxHash
                }
            });
        } catch (error) {
            console.error('Verify credential error:', error);
            res.status(500).json({
                error: 'Failed to verify credential',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new CredentialController(); 
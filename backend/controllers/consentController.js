const Consent = require('../models/Consent');
const User = require('../models/User');
const ipfsService = require('../services/ipfsService');
const blockchainService = require('../services/blockchainService');

class ConsentController {
    // Request consent
    async requestConsent(req, res) {
        try {
            const { dataSubjectId, purpose, type, dataCategories, requestedCredentials, validUntil, consentDetails } = req.body;
            const dataControllerId = req.user._id;

            // Check if data controller has permission
            if (!['verifier', 'issuer', 'admin'].includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Only verifiers, issuers, and admins can request consent'
                });
            }

            // Verify data subject exists
            const dataSubject = await User.findById(dataSubjectId);
            if (!dataSubject) {
                return res.status(404).json({
                    error: 'Data subject not found'
                });
            }

            // Get data controller details
            const dataController = await User.findById(dataControllerId);
            if (!dataController) {
                return res.status(404).json({
                    error: 'Data controller not found'
                });
            }

            // Check if consent already exists
            const existingConsent = await Consent.findOne({
                dataSubjectId,
                dataControllerId,
                purpose,
                status: { $in: ['pending', 'approved'] }
            });

            if (existingConsent) {
                return res.status(400).json({
                    error: 'Consent request already exists for this purpose'
                });
            }

            // Create consent record
            const consent = new Consent({
                dataSubjectId,
                dataControllerId,
                purpose,
                type,
                dataCategories,
                requestedCredentials,
                validUntil,
                consentDetails: {
                    isRevocable: consentDetails?.isRevocable ?? true,
                    isTransferable: consentDetails?.isTransferable ?? false,
                    requiresReconsent: consentDetails?.requiresReconsent ?? false,
                    reconsentInterval: consentDetails?.reconsentInterval ?? 365
                },
                evidence: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    method: 'api'
                }
            });

            await consent.save();

            // Upload to IPFS
            let ipfsData = null;
            try {
                ipfsData = await ipfsService.uploadConsent(
                    consent.toObject(),
                    {
                        dataSubjectId: dataSubject._id,
                        dataControllerId: dataController._id,
                        purpose,
                        type
                    }
                );

                consent.ipfsHash = ipfsData.hash;
                consent.ipfsUrl = ipfsData.url;
                await consent.save();
            } catch (error) {
                console.warn('Failed to upload consent to IPFS:', error.message);
            }

            // Store on blockchain
            let blockchainData = null;
            if (ipfsData && blockchainService.isWalletConnected()) {
                try {
                    blockchainData = await blockchainService.storeConsentHash(
                        consent.consentId,
                        ipfsData.hash,
                        dataSubject.did || dataSubject._id.toString(),
                        dataController.did || dataController._id.toString()
                    );

                    consent.blockchainTxHash = blockchainData.transactionHash;
                    consent.blockchainBlockNumber = blockchainData.blockNumber;
                    await consent.save();
                } catch (error) {
                    console.warn('Failed to store consent on blockchain:', error.message);
                }
            }

            res.status(201).json({
                message: 'Consent request created successfully',
                consent: {
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: {
                        id: dataSubject._id,
                        username: dataSubject.username,
                        did: dataSubject.did
                    },
                    dataController: {
                        id: dataController._id,
                        username: dataController.username,
                        did: dataController.did
                    },
                    purpose: consent.purpose,
                    type: consent.type,
                    dataCategories: consent.dataCategories,
                    requestedAt: consent.requestedAt,
                    validUntil: consent.validUntil,
                    ipfsHash: consent.ipfsHash,
                    ipfsUrl: consent.ipfsUrl,
                    blockchainTxHash: consent.blockchainTxHash
                }
            });
        } catch (error) {
            console.error('Request consent error:', error);
            res.status(500).json({
                error: 'Failed to request consent',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Approve consent
    async approveConsent(req, res) {
        try {
            const { consentId } = req.params;
            const approverId = req.user._id;

            const consent = await Consent.findOne({ consentId })
                .populate('dataSubjectId', 'username email did')
                .populate('dataControllerId', 'username email did');

            if (!consent) {
                return res.status(404).json({
                    error: 'Consent not found'
                });
            }

            // Check if user is the data subject
            if (req.user._id.toString() !== consent.dataSubjectId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. Only the data subject can approve consent.'
                });
            }

            if (consent.status !== 'pending') {
                return res.status(400).json({
                    error: 'Consent is not in pending status'
                });
            }

            // Approve consent
            await consent.approve();

            // Update IPFS with approved consent
            if (consent.ipfsHash) {
                try {
                    const updatedConsent = await Consent.findOne({ consentId });
                    await ipfsService.uploadConsent(
                        updatedConsent.toObject(),
                        {
                            dataSubjectId: consent.dataSubjectId._id,
                            dataControllerId: consent.dataControllerId._id,
                            purpose: consent.purpose,
                            type: consent.type,
                            status: 'approved'
                        }
                    );
                } catch (error) {
                    console.warn('Failed to update IPFS with approved consent:', error.message);
                }
            }

            res.json({
                message: 'Consent approved successfully',
                consent: {
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: consent.dataSubjectId,
                    dataController: consent.dataControllerId,
                    purpose: consent.purpose,
                    type: consent.type,
                    dataCategories: consent.dataCategories,
                    approvedAt: consent.approvedAt,
                    validUntil: consent.validUntil,
                    ipfsHash: consent.ipfsHash,
                    ipfsUrl: consent.ipfsUrl,
                    blockchainTxHash: consent.blockchainTxHash
                }
            });
        } catch (error) {
            console.error('Approve consent error:', error);
            res.status(500).json({
                error: 'Failed to approve consent',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Reject consent
    async rejectConsent(req, res) {
        try {
            const { consentId } = req.params;
            const { reason } = req.body;
            const rejectorId = req.user._id;

            const consent = await Consent.findOne({ consentId })
                .populate('dataSubjectId', 'username email did')
                .populate('dataControllerId', 'username email did');

            if (!consent) {
                return res.status(404).json({
                    error: 'Consent not found'
                });
            }

            // Check if user is the data subject
            if (req.user._id.toString() !== consent.dataSubjectId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. Only the data subject can reject consent.'
                });
            }

            if (consent.status !== 'pending') {
                return res.status(400).json({
                    error: 'Consent is not in pending status'
                });
            }

            // Reject consent
            await consent.reject(reason);

            res.json({
                message: 'Consent rejected successfully',
                consent: {
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: consent.dataSubjectId,
                    dataController: consent.dataControllerId,
                    purpose: consent.purpose,
                    type: consent.type,
                    rejectedAt: consent.rejectedAt,
                    rejectionReason: consent.rejectionReason
                }
            });
        } catch (error) {
            console.error('Reject consent error:', error);
            res.status(500).json({
                error: 'Failed to reject consent',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get user consents
    async getUserConsents(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10, status, type } = req.query;

            // Check if user has permission to view these consents
            if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
                return res.status(403).json({
                    error: 'Access denied. You can only view your own consents.'
                });
            }

            const query = {
                $or: [
                    { dataSubjectId: id },
                    { dataControllerId: id }
                ]
            };

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
                    { path: 'dataSubjectId', select: 'username email did' },
                    { path: 'dataControllerId', select: 'username email did' }
                ],
                sort: { requestedAt: -1 }
            };

            const consents = await Consent.paginate(query, options);

            res.json({
                consents: consents.docs.map(consent => ({
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: consent.dataSubjectId,
                    dataController: consent.dataControllerId,
                    purpose: consent.purpose,
                    type: consent.type,
                    dataCategories: consent.dataCategories,
                    requestedAt: consent.requestedAt,
                    respondedAt: consent.respondedAt,
                    approvedAt: consent.approvedAt,
                    rejectedAt: consent.rejectedAt,
                    validUntil: consent.validUntil,
                    ipfsHash: consent.ipfsHash,
                    ipfsUrl: consent.ipfsUrl,
                    blockchainTxHash: consent.blockchainTxHash,
                    isValid: consent.isValid
                })),
                pagination: {
                    page: consents.page,
                    limit: consents.limit,
                    totalDocs: consents.totalDocs,
                    totalPages: consents.totalPages,
                    hasNextPage: consents.hasNextPage,
                    hasPrevPage: consents.hasPrevPage
                }
            });
        } catch (error) {
            console.error('Get user consents error:', error);
            res.status(500).json({
                error: 'Failed to get user consents',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get consent by ID
    async getConsent(req, res) {
        try {
            const { consentId } = req.params;

            const consent = await Consent.findOne({ consentId })
                .populate('dataSubjectId', 'username email did')
                .populate('dataControllerId', 'username email did');

            if (!consent) {
                return res.status(404).json({
                    error: 'Consent not found'
                });
            }

            // Check if user has permission to view this consent
            if (req.user.role !== 'admin' &&
                req.user._id.toString() !== consent.dataSubjectId._id.toString() &&
                req.user._id.toString() !== consent.dataControllerId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. You can only view consents you are involved in.'
                });
            }

            res.json({
                consent: {
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: consent.dataSubjectId,
                    dataController: consent.dataControllerId,
                    purpose: consent.purpose,
                    type: consent.type,
                    dataCategories: consent.dataCategories,
                    requestedCredentials: consent.requestedCredentials,
                    validFrom: consent.validFrom,
                    validUntil: consent.validUntil,
                    consentDetails: consent.consentDetails,
                    requestedAt: consent.requestedAt,
                    respondedAt: consent.respondedAt,
                    approvedAt: consent.approvedAt,
                    rejectedAt: consent.rejectedAt,
                    rejectionReason: consent.rejectionReason,
                    ipfsHash: consent.ipfsHash,
                    ipfsUrl: consent.ipfsUrl,
                    blockchainTxHash: consent.blockchainTxHash,
                    evidence: consent.evidence,
                    isValid: consent.isValid
                }
            });
        } catch (error) {
            console.error('Get consent error:', error);
            res.status(500).json({
                error: 'Failed to get consent',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Withdraw consent
    async withdrawConsent(req, res) {
        try {
            const { consentId } = req.params;
            const { reason } = req.body;
            const withdrawerId = req.user._id;

            const consent = await Consent.findOne({ consentId })
                .populate('dataSubjectId', 'username email did')
                .populate('dataControllerId', 'username email did');

            if (!consent) {
                return res.status(404).json({
                    error: 'Consent not found'
                });
            }

            // Check if user is the data subject
            if (req.user._id.toString() !== consent.dataSubjectId._id.toString()) {
                return res.status(403).json({
                    error: 'Access denied. Only the data subject can withdraw consent.'
                });
            }

            if (consent.status !== 'approved') {
                return res.status(400).json({
                    error: 'Consent is not approved'
                });
            }

            if (!consent.consentDetails.isRevocable) {
                return res.status(400).json({
                    error: 'This consent is not revocable'
                });
            }

            // Withdraw consent
            await consent.withdraw(withdrawerId, reason);

            res.json({
                message: 'Consent withdrawn successfully',
                consent: {
                    id: consent._id,
                    consentId: consent.consentId,
                    status: consent.status,
                    dataSubject: consent.dataSubjectId,
                    dataController: consent.dataControllerId,
                    purpose: consent.purpose,
                    type: consent.type,
                    withdrawnAt: consent.withdrawnAt,
                    withdrawnBy: consent.withdrawnBy,
                    withdrawalReason: consent.withdrawalReason
                }
            });
        } catch (error) {
            console.error('Withdraw consent error:', error);
            res.status(500).json({
                error: 'Failed to withdraw consent',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new ConsentController(); 
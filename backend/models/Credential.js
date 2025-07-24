const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    credentialId: {
        type: String,
        required: true,
        unique: true
    },
    holderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    issuerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['identity', 'address', 'employment', 'education', 'financial', 'custom']
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired', 'suspended'],
        default: 'active'
    },
    // Verifiable Credential data
    vc: {
        '@context': {
            type: [String],
            default: ['https://www.w3.org/2018/credentials/v1']
        },
        type: {
            type: [String],
            required: true
        },
        issuer: {
            type: String,
            required: true
        },
        issuanceDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        expirationDate: {
            type: Date
        },
        credentialSubject: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        proof: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    // IPFS storage
    ipfsHash: {
        type: String
    },
    ipfsUrl: {
        type: String
    },
    // Blockchain storage
    blockchainTxHash: {
        type: String
    },
    blockchainBlockNumber: {
        type: Number
    },
    // Metadata
    metadata: {
        description: String,
        tags: [String],
        category: String,
        version: {
            type: String,
            default: '1.0'
        }
    },
    // Access control
    allowedVerifiers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    // Audit trail
    issuedAt: {
        type: Date,
        default: Date.now
    },
    revokedAt: Date,
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    revocationReason: String
}, {
    timestamps: true
});

// Indexes for better query performance
credentialSchema.index({ holderId: 1, status: 1 });
credentialSchema.index({ issuerId: 1, status: 1 });
credentialSchema.index({ credentialId: 1 });
credentialSchema.index({ ipfsHash: 1 });
credentialSchema.index({ blockchainTxHash: 1 });
credentialSchema.index({ type: 1, status: 1 });

// Virtual for credential status
credentialSchema.virtual('isExpired').get(function () {
    return this.vc.expirationDate && new Date() > this.vc.expirationDate;
});

// Virtual for credential age
credentialSchema.virtual('age').get(function () {
    return Date.now() - this.issuedAt.getTime();
});

// Method to check if credential is valid
credentialSchema.methods.isValid = function () {
    return this.status === 'active' && !this.isExpired;
};

// Method to revoke credential
credentialSchema.methods.revoke = function (revokedBy, reason) {
    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason;
    return this.save();
};

// Method to get credential data for verification
credentialSchema.methods.getVerificationData = function () {
    return {
        credentialId: this.credentialId,
        vc: this.vc,
        status: this.status,
        ipfsHash: this.ipfsHash,
        blockchainTxHash: this.blockchainTxHash,
        issuedAt: this.issuedAt,
        revokedAt: this.revokedAt
    };
};

// Pre-save middleware to generate credential ID if not provided
credentialSchema.pre('save', function (next) {
    if (!this.credentialId) {
        this.credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

module.exports = mongoose.model('Credential', credentialSchema); 
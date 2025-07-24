const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
    consentId: {
        type: String,
        required: true,
        unique: true
    },
    dataSubjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dataControllerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired', 'withdrawn'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['explicit', 'implicit', 'opt_in', 'opt_out'],
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    description: String,
    // Data categories being requested
    dataCategories: [{
        type: String,
        enum: ['personal_info', 'identity_documents', 'financial_data', 'biometric_data', 'location_data', 'behavioral_data']
    }],
    // Specific credentials being requested
    requestedCredentials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credential'
    }],
    // Duration of consent
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date
    },
    // Consent details
    consentDetails: {
        isRevocable: {
            type: Boolean,
            default: true
        },
        isTransferable: {
            type: Boolean,
            default: false
        },
        requiresReconsent: {
            type: Boolean,
            default: false
        },
        reconsentInterval: {
            type: Number, // in days
            default: 365
        }
    },
    // Blockchain storage
    blockchainTxHash: {
        type: String
    },
    blockchainBlockNumber: {
        type: Number
    },
    // IPFS storage
    ipfsHash: {
        type: String
    },
    // Audit trail
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    withdrawnAt: Date,
    withdrawnBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: String,
    withdrawalReason: String,
    // Consent evidence
    evidence: {
        ipAddress: String,
        userAgent: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        method: {
            type: String,
            enum: ['web_form', 'mobile_app', 'api', 'blockchain'],
            default: 'web_form'
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
consentSchema.index({ dataSubjectId: 1, status: 1 });
consentSchema.index({ dataControllerId: 1, status: 1 });
consentSchema.index({ consentId: 1 });
consentSchema.index({ blockchainTxHash: 1 });
consentSchema.index({ ipfsHash: 1 });
consentSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual for consent validity
consentSchema.virtual('isValid').get(function () {
    if (this.status !== 'approved') return false;
    if (this.validUntil && new Date() > this.validUntil) return false;
    return true;
});

// Virtual for consent age
consentSchema.virtual('age').get(function () {
    return Date.now() - this.requestedAt.getTime();
});

// Method to approve consent
consentSchema.methods.approve = function () {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.respondedAt = new Date();
    return this.save();
};

// Method to reject consent
consentSchema.methods.reject = function (reason) {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.respondedAt = new Date();
    this.rejectionReason = reason;
    return this.save();
};

// Method to withdraw consent
consentSchema.methods.withdraw = function (withdrawnBy, reason) {
    this.status = 'withdrawn';
    this.withdrawnAt = new Date();
    this.withdrawnBy = withdrawnBy;
    this.withdrawalReason = reason;
    return this.save();
};

// Method to check if consent needs renewal
consentSchema.methods.needsRenewal = function () {
    if (!this.consentDetails.requiresReconsent) return false;
    if (!this.approvedAt) return false;

    const renewalDate = new Date(this.approvedAt);
    renewalDate.setDate(renewalDate.getDate() + this.consentDetails.reconsentInterval);

    return new Date() > renewalDate;
};

// Pre-save middleware to generate consent ID if not provided
consentSchema.pre('save', function (next) {
    if (!this.consentId) {
        this.consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

module.exports = mongoose.model('Consent', consentSchema); 
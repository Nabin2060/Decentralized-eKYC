const express = require('express');
const router = express.Router();
const credentialController = require('../controllers/credentialController');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    validateCredentialIssuance,
    validateCredentialRevocation,
    validateUserId,
    validatePagination
} = require('../middleware/validation');

// POST /credentials/issue - Issue a new credential (protected, issuer/admin only)
router.post('/issue',
    verifyToken,
    requireRole(['issuer', 'admin']),
    validateCredentialIssuance,
    credentialController.issueCredential
);

// GET /credentials/user/:id - Get user credentials (protected)
router.get('/user/:id',
    verifyToken,
    validateUserId,
    validatePagination,
    credentialController.getUserCredentials
);

// GET /credentials/:credentialId - Get specific credential (protected)
router.get('/:credentialId',
    verifyToken,
    credentialController.getCredential
);

// POST /credentials/revoke - Revoke a credential (protected, issuer/admin only)
router.post('/revoke',
    verifyToken,
    requireRole(['issuer', 'admin']),
    validateCredentialRevocation,
    credentialController.revokeCredential
);

// GET /credentials/:credentialId/verify - Verify a credential (protected)
router.get('/:credentialId/verify',
    verifyToken,
    credentialController.verifyCredential
);

module.exports = router; 
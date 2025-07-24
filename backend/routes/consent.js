const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    validateConsentRequest,
    validateConsentApproval,
    validateUserId,
    validatePagination
} = require('../middleware/validation');

// POST /consent/request - Request consent (protected, verifier/issuer/admin only)
router.post('/request',
    verifyToken,
    requireRole(['verifier', 'issuer', 'admin']),
    validateConsentRequest,
    consentController.requestConsent
);

// POST /consent/:consentId/approve - Approve consent (protected, data subject only)
router.post('/:consentId/approve',
    verifyToken,
    validateConsentApproval,
    consentController.approveConsent
);

// POST /consent/:consentId/reject - Reject consent (protected, data subject only)
router.post('/:consentId/reject',
    verifyToken,
    validateConsentApproval,
    consentController.rejectConsent
);

// GET /consent/user/:id - Get user consents (protected)
router.get('/user/:id',
    verifyToken,
    validateUserId,
    validatePagination,
    consentController.getUserConsents
);

// GET /consent/:consentId - Get specific consent (protected)
router.get('/:consentId',
    verifyToken,
    consentController.getConsent
);

// POST /consent/:consentId/withdraw - Withdraw consent (protected, data subject only)
router.post('/:consentId/withdraw',
    verifyToken,
    validateConsentApproval,
    consentController.withdrawConsent
);

module.exports = router; 
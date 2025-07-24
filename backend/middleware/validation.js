const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateRegistration = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
    // .matches(/^[a-zA-Z0-9_]+$/)
    // .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    // body('password')
    //     .isLength({ min: 6 })
    //     .withMessage('Password must be at least 6 characters long')
    //     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    //     .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    body('role')
        .optional()
        .isIn(['user', 'issuer', 'verifier', 'admin'])
        .withMessage('Invalid role specified'),

    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Credential issuance validation
const validateCredentialIssuance = [
    body('holderId')
        .isMongoId()
        .withMessage('Invalid holder ID'),

    body('type')
        .isIn(['identity', 'address', 'employment', 'education', 'financial', 'custom'])
        .withMessage('Invalid credential type'),

    body('credentialSubject')
        .isObject()
        .withMessage('Credential subject must be an object'),

    body('expirationDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiration date format'),

    body('metadata.description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),

    handleValidationErrors
];

// Credential revocation validation
const validateCredentialRevocation = [
    body('credentialId')
        .notEmpty()
        .withMessage('Credential ID is required'),

    body('reason')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Reason must be less than 200 characters'),

    handleValidationErrors
];

// Consent request validation
const validateConsentRequest = [
    body('dataSubjectId')
        .isMongoId()
        .withMessage('Invalid data subject ID'),

    body('purpose')
        .isLength({ min: 10, max: 200 })
        .withMessage('Purpose must be between 10 and 200 characters'),

    body('type')
        .isIn(['explicit', 'implicit', 'opt_in', 'opt_out'])
        .withMessage('Invalid consent type'),

    body('dataCategories')
        .isArray({ min: 1 })
        .withMessage('At least one data category must be specified'),

    body('dataCategories.*')
        .isIn(['personal_info', 'identity_documents', 'financial_data', 'biometric_data', 'location_data', 'behavioral_data'])
        .withMessage('Invalid data category'),

    body('validUntil')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiration date format'),

    handleValidationErrors
];

// Consent approval validation
const validateConsentApproval = [
    param('consentId')
        .notEmpty()
        .withMessage('Consent ID is required'),

    handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    handleValidationErrors
];

// Search validation
const validateSearch = [
    query('q')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters'),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateRegistration,
    validateLogin,
    validateCredentialIssuance,
    validateCredentialRevocation,
    validateConsentRequest,
    validateConsentApproval,
    validateUserId,
    validatePagination,
    validateSearch
}; 
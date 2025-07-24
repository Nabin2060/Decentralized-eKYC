const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const didService = require('../services/didService');

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const { username, email, password, role = 'user', profile } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    error: 'User already exists with this email or username'
                });
            }

            // Generate DID for the user
            let didData = null;
            try {
                didData = await didService.generateDID();
            } catch (error) {
                console.warn('Failed to generate DID, continuing without DID:', error.message);
            }

            // Create new user
            const userData = {
                username,
                email,
                password,
                role,
                profile
            };

            if (didData) {
                userData.did = didData.did;
                userData.publicKey = didData.publicKey;
            }

            const user = new User(userData);
            await user.save();

            // Generate JWT token
            const token = generateToken(user._id);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    did: user.did,
                    kycStatus: user.kycStatus,
                    profile: user.profile
                },
                token,
                did: didData ? {
                    did: didData.did,
                    publicKey: didData.publicKey
                } : null
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Failed to register user',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            // Check if account is locked
            if (user.isLocked()) {
                return res.status(423).json({
                    error: 'Account is locked due to too many failed login attempts. Please try again later.'
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // Increment login attempts
                await user.incLoginAttempts();

                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = generateToken(user._id);

            res.json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    did: user.did,
                    kycStatus: user.kycStatus,
                    profile: user.profile,
                    lastLogin: user.lastLogin
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Failed to login',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get current user profile
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id).select('-password');

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    did: user.did,
                    kycStatus: user.kycStatus,
                    profile: user.profile,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                error: 'Failed to get user profile',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const { profile } = req.body;
            const userId = req.user._id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            // Update profile fields
            if (profile) {
                user.profile = { ...user.profile, ...profile };
            }

            await user.save();

            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    did: user.did,
                    kycStatus: user.kycStatus,
                    profile: user.profile,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: 'Failed to update profile',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user._id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    error: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                error: 'Failed to change password',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Refresh token
    async refreshToken(req, res) {
        try {
            const userId = req.user._id;

            const user = await User.findById(userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    error: 'Account is deactivated'
                });
            }

            // Generate new token
            const token = generateToken(user._id);

            res.json({
                message: 'Token refreshed successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    did: user.did,
                    kycStatus: user.kycStatus
                }
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                error: 'Failed to refresh token',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new AuthController(); 
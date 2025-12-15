const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { query } = require('./db');
const { JWT_SECRET } = require('./authMiddleware');
const { sendVerificationEmail } = require('./emailService');

const router = express.Router();

// Register
router.post('/register',
    [
        body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password } = req.body;

            // Check if user exists
            const existingUser = await query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Generate verification token
            const verification_token = crypto.randomBytes(32).toString('hex');
            const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Create user
            const result = await query(
                'INSERT INTO users (username, email, password_hash, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?)',
                [username, email, password_hash, verification_token, verification_token_expires.toISOString()]
            );

            // Send verification email
            const emailResult = await sendVerificationEmail(email, username, verification_token);

            if (!emailResult.success) {
                console.error('Failed to send verification email:', emailResult.error);
                // Still allow registration to succeed, but log the error
                // In production, you might want to handle this differently
            }

            res.status(201).json({
                message: 'Registration successful! Please check your email to verify your account.',
                email: email
            });
        } catch (error) {
            console.error('Register error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }
);

// Login
router.post('/login',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;

            // Find user
            const result = await query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Check if account is locked
            if (user.locked_until) {
                const lockExpiry = new Date(user.locked_until);
                const now = new Date();

                if (now < lockExpiry) {
                    const minutesLeft = Math.ceil((lockExpiry - now) / (1000 * 60));
                    return res.status(403).json({
                        error: `Account locked. Try again in ${minutesLeft} minutes.`,
                        locked: true,
                        lockedUntil: user.locked_until
                    });
                } else {
                    // Lock expired, reset
                    await query(
                        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                        [user.id]
                    );
                }
            }

            // Check if email is verified
            if (!user.email_verified) {
                return res.status(403).json({
                    error: 'Please verify your email before logging in',
                    emailNotVerified: true
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                // Increment failed login attempts
                const newAttempts = (user.failed_login_attempts || 0) + 1;

                if (newAttempts >= 5) {
                    // Lock account for 15 minutes
                    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                    await query(
                        'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                        [newAttempts, lockUntil.toISOString(), user.id]
                    );

                    return res.status(403).json({
                        error: 'Too many failed login attempts. Account locked for 15 minutes.',
                        locked: true,
                        lockedUntil: lockUntil.toISOString()
                    });
                } else {
                    // Update failed attempts
                    await query(
                        'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
                        [newAttempts, user.id]
                    );

                    const attemptsLeft = 5 - newAttempts;
                    return res.status(400).json({
                        error: `Invalid credentials. ${attemptsLeft} attempts remaining.`
                    });
                }
            }

            // Successful login - reset failed attempts
            await query(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                [user.id]
            );

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const result = await query(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with this token
        const result = await query(
            'SELECT * FROM users WHERE verification_token = ?',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        const user = result.rows[0];

        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(user.verification_token_expires);

        if (now > expiresAt) {
            return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        }

        // Check if already verified
        if (user.email_verified) {
            return res.status(200).json({ message: 'Email already verified. You can now login.' });
        }

        // Update user as verified
        await query(
            'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
            [user.id]
        );

        res.json({
            message: 'Email verified successfully! You can now login.',
            success: true
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Resend verification email
router.post('/resend-verification',
    [
        body('email').isEmail().withMessage('Please enter a valid email')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email } = req.body;

            // Find user
            const result = await query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (result.rows.length === 0) {
                // Don't reveal if email exists or not
                return res.json({ message: 'If that email is registered, a verification email has been sent.' });
            }

            const user = result.rows[0];

            // Check if already verified
            if (user.email_verified) {
                return res.status(400).json({ error: 'Email is already verified' });
            }

            // Generate new verification token
            const verification_token = crypto.randomBytes(32).toString('hex');
            const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Update token
            await query(
                'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
                [verification_token, verification_token_expires.toISOString(), user.id]
            );

            // Send verification email
            await sendVerificationEmail(user.email, user.username, verification_token);

            res.json({ message: 'Verification email sent. Please check your inbox.' });
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// DEVELOPMENT ONLY: Get verification link for testing
// Remove this in production!
router.get('/dev/verification-link/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const result = await query(
            'SELECT username, verification_token FROM users WHERE email = ?',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.verification_token) {
            return res.json({ message: 'Email already verified or no token found' });
        }

        const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email/${user.verification_token}`;

        res.json({
            email: email,
            username: user.username,
            verificationLink: verificationUrl,
            message: 'Click the link below to verify your email'
        });
    } catch (error) {
        console.error('Dev verification link error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

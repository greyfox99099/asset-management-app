const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const { role } = req.user; // Role should be in token, or fetched from DB

        // If role is in token:
        if (role === 'admin') {
            return next();
        }

        // Fallback: Fetch from DB if not in token (safer)
        // const { query } = require('./db');
        // const result = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
        // if (result.rows.length > 0 && result.rows[0].role === 'admin') {
        //     next();
        // } else {
        //     res.status(403).json({ error: 'Access denied: Admin only' });
        // }

        res.status(403).json({ error: 'Access denied: Admin only' });

    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { authMiddleware, isAdmin, JWT_SECRET };

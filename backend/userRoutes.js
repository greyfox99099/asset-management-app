const express = require('express');
const { query } = require('./db');
const { isAdmin } = require('./authMiddleware'); // Middleware needed

const router = express.Router();

// GET all users (Admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, username, email, role, email_verified, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE user (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (req.user.id == id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE user role (Admin only)
router.put('/:id/role', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Prevent changing own role
        if (req.user.id == id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

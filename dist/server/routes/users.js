"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const users = await (0, database_1.default)('users')
            .select('id', 'username', 'email', 'role', 'created_at')
            .orderBy('username');
        return res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Failed to get users' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await (0, database_1.default)('users')
            .select('id', 'username', 'email', 'role', 'created_at')
            .where({ id })
            .first();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to get user' });
    }
});
router.patch('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const currentUser = req.user;
        if (currentUser.id !== id && currentUser.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        const updateData = {};
        if (email)
            updateData.email = email;
        if (role && currentUser.role === 'admin')
            updateData.role = role;
        await (0, database_1.default)('users')
            .where({ id })
            .update({
            ...updateData,
            updated_at: database_1.default.fn.now()
        });
        const updatedUser = await (0, database_1.default)('users')
            .select('id', 'username', 'email', 'role', 'created_at')
            .where({ id })
            .first();
        return res.json(updatedUser);
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const adminCount = await (0, database_1.default)('users').where({ role: 'admin' }).count('* as count').first();
        const userToDelete = await (0, database_1.default)('users').where({ id }).first();
        if (adminCount && adminCount['count'] === 1 && userToDelete?.role === 'admin') {
            return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }
        await (0, database_1.default)('users').where({ id }).del();
        return res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await (0, database_1.default)('users').where({ username }).first();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const secret = process.env['JWT_SECRET'] || 'your-secret-key';
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '24h' });
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await (0, database_1.default)('users').where({ id: userId }).first();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to get user' });
    }
});
router.post('/logout', (_req, res) => {
    return res.json({ message: 'Logged out successfully' });
});
router.post('/register', auth_1.authenticateToken, validation_1.validateUser, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const existingUser = await (0, database_1.default)('users').where({ username }).orWhere({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const [userId] = await (0, database_1.default)('users').insert({
            username,
            email,
            password: hashedPassword,
            role: role || 'dispatcher'
        }).returning('id');
        return res.status(201).json({ message: 'User created successfully', userId });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await (0, database_1.default)('notifications')
            .select('*')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
        return res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ error: 'Failed to get notifications' });
    }
});
router.get('/unread', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadNotifications = await (0, database_1.default)('notifications')
            .select('*')
            .where({
            user_id: userId,
            read: false
        })
            .orderBy('created_at', 'desc');
        return res.json(unreadNotifications);
    }
    catch (error) {
        console.error('Get unread notifications error:', error);
        return res.status(500).json({ error: 'Failed to get unread notifications' });
    }
});
router.patch('/:id/read', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await (0, database_1.default)('notifications')
            .where({ id, user_id: userId })
            .update({ read: true, read_at: database_1.default.fn.now() });
        return res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
router.patch('/read-all', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, database_1.default)('notifications')
            .where({ user_id: userId, read: false })
            .update({ read: true, read_at: database_1.default.fn.now() });
        return res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await (0, database_1.default)('notifications')
            .where({ id, user_id: userId })
            .del();
        return res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
});
const createNotification = async (userId, type, title, message, data) => {
    try {
        await (0, database_1.default)('notifications').insert({
            user_id: userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
            read: false
        });
    }
    catch (error) {
        console.error('Create notification error:', error);
    }
};
exports.createNotification = createNotification;
exports.default = router;
//# sourceMappingURL=notifications.js.map
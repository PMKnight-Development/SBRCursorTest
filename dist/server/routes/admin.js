"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/dashboard/stats', auth_1.authenticateToken, async (_req, res) => {
    try {
        const [totalCalls, activeCalls, pendingCalls, totalUnits, availableUnits, dispatchedUnits] = await Promise.all([
            (0, database_1.default)('calls').count('* as count').first(),
            (0, database_1.default)('calls').whereIn('status', ['dispatched', 'en-route', 'on-scene']).count('* as count').first(),
            (0, database_1.default)('calls').where('status', 'pending').count('* as count').first(),
            (0, database_1.default)('units').count('* as count').first(),
            (0, database_1.default)('units').where('status', 'available').count('* as count').first(),
            (0, database_1.default)('units').where('status', 'dispatched').count('* as count').first(),
        ]);
        const stats = {
            total_calls: parseInt(totalCalls?.['count']) || 0,
            active_calls: parseInt(activeCalls?.['count']) || 0,
            pending_calls: parseInt(pendingCalls?.['count']) || 0,
            total_units: parseInt(totalUnits?.['count']) || 0,
            available_units: parseInt(availableUnits?.['count']) || 0,
            dispatched_units: parseInt(dispatchedUnits?.['count']) || 0,
        };
        return res.json(stats);
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
});
router.get('/call-types', auth_1.authenticateToken, async (_req, res) => {
    try {
        const callTypes = await (0, database_1.default)('call_types').select('*').orderBy('name');
        return res.json(callTypes);
    }
    catch (error) {
        console.error('Get call types error:', error);
        return res.status(500).json({ error: 'Failed to get call types' });
    }
});
router.post('/call-types', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, description, priority, color } = req.body;
        if (!name || !priority) {
            return res.status(400).json({ error: 'Name and priority are required' });
        }
        const [callType] = await (0, database_1.default)('call_types')
            .insert({
            name,
            description: description || '',
            priority,
            color: color || '#1976d2'
        })
            .returning('*');
        return res.status(201).json(callType);
    }
    catch (error) {
        console.error('Create call type error:', error);
        return res.status(500).json({ error: 'Failed to create call type' });
    }
});
router.patch('/call-types/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, priority, color } = req.body;
        const [callType] = await (0, database_1.default)('call_types')
            .where({ id })
            .update({
            name,
            description: description || '',
            priority,
            color: color || '#1976d2'
        })
            .returning('*');
        if (!callType) {
            return res.status(404).json({ error: 'Call type not found' });
        }
        return res.json(callType);
    }
    catch (error) {
        console.error('Update call type error:', error);
        return res.status(500).json({ error: 'Failed to update call type' });
    }
});
router.get('/unit-groups', auth_1.authenticateToken, async (_req, res) => {
    try {
        const unitGroups = await (0, database_1.default)('unit_groups').select('*').orderBy('group_name');
        return res.json(unitGroups);
    }
    catch (error) {
        console.error('Get unit groups error:', error);
        return res.status(500).json({ error: 'Failed to get unit groups' });
    }
});
router.post('/unit-groups', auth_1.authenticateToken, async (req, res) => {
    try {
        const { group_name, description, group_type, color } = req.body;
        if (!group_name || !group_type) {
            return res.status(400).json({ error: 'Group name and type are required' });
        }
        const [unitGroup] = await (0, database_1.default)('unit_groups')
            .insert({
            group_name,
            description: description || '',
            group_type,
            color: color || '#1976d2'
        })
            .returning('*');
        return res.status(201).json(unitGroup);
    }
    catch (error) {
        console.error('Create unit group error:', error);
        return res.status(500).json({ error: 'Failed to create unit group' });
    }
});
router.patch('/unit-groups/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { group_name, description, group_type, color } = req.body;
        const [unitGroup] = await (0, database_1.default)('unit_groups')
            .where({ id })
            .update({
            group_name,
            description: description || '',
            group_type,
            color: color || '#1976d2'
        })
            .returning('*');
        if (!unitGroup) {
            return res.status(404).json({ error: 'Unit group not found' });
        }
        return res.json(unitGroup);
    }
    catch (error) {
        console.error('Update unit group error:', error);
        return res.status(500).json({ error: 'Failed to update unit group' });
    }
});
router.get('/map-layers', auth_1.authenticateToken, async (_req, res) => {
    try {
        const mapLayers = await (0, database_1.default)('map_layers')
            .select('*')
            .orderBy('order', 'asc')
            .orderBy('name', 'asc');
        return res.json(mapLayers);
    }
    catch (error) {
        console.error('Get map layers error:', error);
        return res.status(500).json({ error: 'Failed to get map layers' });
    }
});
router.post('/map-layers', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, type, url, layer_id, opacity, visible, description } = req.body;
        if (!name || !type || !url) {
            return res.status(400).json({ error: 'Name, type, and URL are required' });
        }
        const maxOrder = await (0, database_1.default)('map_layers').max('order as max_order').first();
        const nextOrder = (maxOrder?.['max_order'] || 0) + 1;
        const [mapLayer] = await (0, database_1.default)('map_layers')
            .insert({
            name,
            type,
            url,
            layer_id: layer_id || null,
            opacity: opacity || 0.8,
            visible: visible !== undefined ? visible : true,
            description: description || '',
            order: nextOrder
        })
            .returning('*');
        return res.status(201).json(mapLayer);
    }
    catch (error) {
        console.error('Create map layer error:', error);
        return res.status(500).json({ error: 'Failed to create map layer' });
    }
});
router.patch('/map-layers/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, url, layer_id, opacity, visible, description } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (type !== undefined)
            updateData.type = type;
        if (url !== undefined)
            updateData.url = url;
        if (layer_id !== undefined)
            updateData.layer_id = layer_id;
        if (opacity !== undefined)
            updateData.opacity = opacity;
        if (visible !== undefined)
            updateData.visible = visible;
        if (description !== undefined)
            updateData.description = description;
        const [mapLayer] = await (0, database_1.default)('map_layers')
            .where({ id })
            .update(updateData)
            .returning('*');
        if (!mapLayer) {
            return res.status(404).json({ error: 'Map layer not found' });
        }
        return res.json(mapLayer);
    }
    catch (error) {
        console.error('Update map layer error:', error);
        return res.status(500).json({ error: 'Failed to update map layer' });
    }
});
router.delete('/map-layers/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await (0, database_1.default)('map_layers')
            .where({ id })
            .del();
        if (!deleted) {
            return res.status(404).json({ error: 'Map layer not found' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Delete map layer error:', error);
        return res.status(500).json({ error: 'Failed to delete map layer' });
    }
});
router.patch('/map-layers/reorder', auth_1.authenticateToken, async (req, res) => {
    try {
        const { layers } = req.body;
        if (!Array.isArray(layers)) {
            return res.status(400).json({ error: 'Layers array is required' });
        }
        for (const layer of layers) {
            await (0, database_1.default)('map_layers')
                .where({ id: layer.id })
                .update({ order: layer.order });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Reorder map layers error:', error);
        return res.status(500).json({ error: 'Failed to reorder map layers' });
    }
});
router.get('/users', auth_1.authenticateToken, async (_req, res) => {
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
router.post('/users', auth_1.authenticateToken, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        const existingUser = await (0, database_1.default)('users')
            .where({ username })
            .orWhere({ email })
            .first();
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = password;
        const [user] = await (0, database_1.default)('users')
            .insert({
            username,
            email,
            password: hashedPassword,
            role: role || 'dispatcher'
        })
            .returning(['id', 'username', 'email', 'role', 'created_at']);
        return res.status(201).json(user);
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
});
router.get('/stats', auth_1.authenticateToken, async (_req, res) => {
    try {
        const totalCalls = await (0, database_1.default)('calls').count('* as count').first();
        const activeCalls = await (0, database_1.default)('calls').whereIn('status', ['pending', 'dispatched', 'en-route', 'on-scene']).count('* as count').first();
        const totalUnits = await (0, database_1.default)('units').count('* as count').first();
        const availableUnits = await (0, database_1.default)('units').where({ status: 'available' }).count('* as count').first();
        const totalUsers = await (0, database_1.default)('users').count('* as count').first();
        const stats = {
            totalCalls: totalCalls?.['count'] || 0,
            activeCalls: activeCalls?.['count'] || 0,
            totalUnits: totalUnits?.['count'] || 0,
            availableUnits: availableUnits?.['count'] || 0,
            totalUsers: totalUsers?.['count'] || 0
        };
        return res.json(stats);
    }
    catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({ error: 'Failed to get system statistics' });
    }
});
router.get('/logs', auth_1.authenticateToken, async (_req, res) => {
    try {
        const logs = await (0, database_1.default)('system_logs')
            .select('*')
            .orderBy('created_at', 'desc')
            .limit(100);
        return res.json({
            logs,
            total: logs.length
        });
    }
    catch (error) {
        console.error('Get logs error:', error);
        return res.status(500).json({ error: 'Failed to get system logs' });
    }
});
router.get('/pois', auth_1.authenticateToken, async (_req, res) => {
    try {
        const pois = await (0, database_1.default)('points_of_interest')
            .select('*')
            .where({ is_active: true })
            .orderBy('name');
        return res.json(pois);
    }
    catch (error) {
        console.error('Get POIs error:', error);
        return res.status(500).json({ error: 'Failed to get points of interest' });
    }
});
router.get('/pois/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const pois = await (0, database_1.default)('points_of_interest')
            .select('*')
            .where({ is_active: true })
            .andWhere(function () {
            this.where('name', 'ilike', `%${q}%`)
                .orWhere('description', 'ilike', `%${q}%`)
                .orWhere('type', 'ilike', `%${q}%`);
        })
            .orderBy('name')
            .limit(20);
        return res.json(pois);
    }
    catch (error) {
        console.error('Search POIs error:', error);
        return res.status(500).json({ error: 'Failed to search points of interest' });
    }
});
router.post('/pois', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, type, latitude, longitude, description } = req.body;
        if (!name || !type || !latitude || !longitude) {
            return res.status(400).json({ error: 'Name, type, latitude, and longitude are required' });
        }
        const [poi] = await (0, database_1.default)('points_of_interest')
            .insert({
            name,
            type,
            latitude,
            longitude,
            description: description || '',
            is_active: true
        })
            .returning('*');
        return res.status(201).json(poi);
    }
    catch (error) {
        console.error('Create POI error:', error);
        return res.status(500).json({ error: 'Failed to create point of interest' });
    }
});
router.patch('/pois/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, latitude, longitude, description, is_active } = req.body;
        const [poi] = await (0, database_1.default)('points_of_interest')
            .where({ id })
            .update({
            name,
            type,
            latitude,
            longitude,
            description: description || '',
            is_active: is_active !== undefined ? is_active : true
        })
            .returning('*');
        if (!poi) {
            return res.status(404).json({ error: 'Point of interest not found' });
        }
        return res.json(poi);
    }
    catch (error) {
        console.error('Update POI error:', error);
        return res.status(500).json({ error: 'Failed to update point of interest' });
    }
});
router.delete('/pois/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await (0, database_1.default)('points_of_interest')
            .where({ id })
            .del();
        if (!deleted) {
            return res.status(404).json({ error: 'Point of interest not found' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Delete POI error:', error);
        return res.status(500).json({ error: 'Failed to delete point of interest' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map
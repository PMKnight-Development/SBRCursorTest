"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (_req, res) => {
    try {
        const calls = await (0, database_1.default)('calls')
            .select('calls.*', 'call_types.name as call_type', 'users.username as dispatcher_name')
            .leftJoin('call_types', 'calls.call_type_id', 'call_types.id')
            .leftJoin('users', 'calls.dispatcher_id', 'users.id')
            .orderBy('calls.created_at', 'desc');
        return res.json(calls);
    }
    catch (error) {
        console.error('Get calls error:', error);
        return res.status(500).json({ error: 'Failed to get calls' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { call_type_id, priority, latitude, longitude, address, description, caller_name, caller_phone } = req.body;
        if (!call_type_id || !priority || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const dispatcherId = req.user.id;
        const callNumber = `CALL-${Date.now()}`;
        const [call] = await (0, database_1.default)('calls')
            .insert({
            call_number: callNumber,
            call_type_id,
            priority,
            status: 'pending',
            latitude: latitude || 0,
            longitude: longitude || 0,
            address: address || '',
            description,
            caller_name: caller_name || '',
            caller_phone: caller_phone || '',
            dispatcher_id: dispatcherId,
            assigned_units: []
        })
            .returning('*');
        await (0, database_1.default)('call_events').insert({
            call_id: call.id,
            event_type: 'created',
            description: 'Call created',
            user_id: dispatcherId,
            timestamp: new Date()
        });
        return res.status(201).json(call);
    }
    catch (error) {
        console.error('Create call error:', error);
        return res.status(500).json({ error: 'Failed to create call' });
    }
});
router.patch('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        const [call] = await (0, database_1.default)('calls')
            .where({ id })
            .update({
            ...updateData,
            updated_at: new Date()
        })
            .returning('*');
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        if (updateData.status) {
            await (0, database_1.default)('call_events').insert({
                call_id: id,
                event_type: 'status_change',
                description: `Status changed to ${updateData.status}`,
                user_id: userId,
                timestamp: new Date()
            });
        }
        return res.json(call);
    }
    catch (error) {
        console.error('Update call error:', error);
        return res.status(500).json({ error: 'Failed to update call' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const call = await (0, database_1.default)('calls')
            .select('calls.*', 'call_types.name as call_type_name', 'users.username as dispatcher_name')
            .leftJoin('call_types', 'calls.call_type_id', 'call_types.id')
            .leftJoin('users', 'calls.dispatcher_id', 'users.id')
            .where('calls.id', id)
            .first();
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        return res.json(call);
    }
    catch (error) {
        console.error('Get call error:', error);
        return res.status(500).json({ error: 'Failed to get call' });
    }
});
router.get('/:id/details', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const call = await (0, database_1.default)('calls')
            .select('calls.*', 'call_types.name as call_type', 'users.username as dispatcher_name')
            .leftJoin('call_types', 'calls.call_type_id', 'call_types.id')
            .leftJoin('users', 'calls.dispatcher_id', 'users.id')
            .where('calls.id', id)
            .first();
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        const timeline = await (0, database_1.default)('call_events')
            .select('call_events.*', 'users.username as user_name')
            .leftJoin('users', 'call_events.user_id', 'users.id')
            .where('call_events.call_id', id)
            .orderBy('call_events.timestamp', 'desc');
        call.timeline = timeline;
        return res.json(call);
    }
    catch (error) {
        console.error('Get call details error:', error);
        return res.status(500).json({ error: 'Failed to get call details' });
    }
});
router.patch('/:id/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const [call] = await (0, database_1.default)('calls')
            .where({ id })
            .update({
            status,
            updated_at: new Date()
        })
            .returning('*');
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        await (0, database_1.default)('call_events').insert({
            call_id: id,
            event_type: 'status_change',
            description: `Status changed to ${status}`,
            user_id: userId,
            timestamp: new Date()
        });
        return res.json(call);
    }
    catch (error) {
        console.error('Update call status error:', error);
        return res.status(500).json({ error: 'Failed to update call status' });
    }
});
router.post('/:id/units', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_id, action } = req.body;
        const userId = req.user.id;
        if (!unit_id || !action) {
            return res.status(400).json({ error: 'Unit ID and action are required' });
        }
        const call = await (0, database_1.default)('calls').where({ id }).first();
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        let assignedUnits = call.assigned_units || [];
        if (action === 'assign') {
            if (!assignedUnits.includes(unit_id)) {
                assignedUnits.push(unit_id);
            }
            await (0, database_1.default)('units')
                .where({ id: unit_id })
                .update({
                status: 'dispatched',
                assigned_call_id: id
            });
        }
        else if (action === 'unassign') {
            assignedUnits = assignedUnits.filter((unitId) => unitId !== unit_id);
            await (0, database_1.default)('units')
                .where({ id: unit_id })
                .update({
                status: 'available',
                assigned_call_id: null
            });
        }
        const [updatedCall] = await (0, database_1.default)('calls')
            .where({ id })
            .update({
            assigned_units: assignedUnits,
            updated_at: new Date()
        })
            .returning('*');
        await (0, database_1.default)('call_events').insert({
            call_id: id,
            event_type: 'unit_assignment',
            description: `Unit ${action === 'assign' ? 'assigned' : 'unassigned'}`,
            user_id: userId,
            timestamp: new Date()
        });
        return res.json(updatedCall);
    }
    catch (error) {
        console.error('Unit assignment error:', error);
        return res.status(500).json({ error: 'Failed to update unit assignment' });
    }
});
router.patch('/:id/assign', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_ids } = req.body;
        if (!unit_ids || !Array.isArray(unit_ids)) {
            return res.status(400).json({ error: 'Unit IDs array is required' });
        }
        const [call] = await (0, database_1.default)('calls')
            .where({ id })
            .update({ assigned_units: unit_ids })
            .returning('*');
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        await (0, database_1.default)('units')
            .whereIn('id', unit_ids)
            .update({
            status: 'dispatched',
            assigned_call_id: id
        });
        return res.json(call);
    }
    catch (error) {
        console.error('Assign units error:', error);
        return res.status(500).json({ error: 'Failed to assign units' });
    }
});
exports.default = router;
//# sourceMappingURL=calls.js.map
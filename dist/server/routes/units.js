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
        const units = await (0, database_1.default)('units')
            .select('units.*', 'unit_groups.group_name')
            .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
            .orderBy('units.unit_number');
        return res.json(units);
    }
    catch (error) {
        console.error('Get units error:', error);
        return res.status(500).json({ error: 'Failed to get units' });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { unit_number, unit_name, unit_type, group_id, status } = req.body;
        if (!unit_number || !unit_name || !unit_type || !group_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existingUnit = await (0, database_1.default)('units').where({ unit_number }).first();
        if (existingUnit) {
            return res.status(400).json({ error: 'Unit number already exists' });
        }
        const [unit] = await (0, database_1.default)('units')
            .insert({
            unit_number,
            unit_name,
            unit_type,
            group_id,
            status: status || 'available',
            is_active: true
        })
            .returning('*');
        return res.status(201).json(unit);
    }
    catch (error) {
        console.error('Create unit error:', error);
        return res.status(500).json({ error: 'Failed to create unit' });
    }
});
router.patch('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_number, unit_name, unit_type, group_id, status } = req.body;
        if (unit_number) {
            const existingUnit = await (0, database_1.default)('units')
                .where({ unit_number })
                .whereNot({ id })
                .first();
            if (existingUnit) {
                return res.status(400).json({ error: 'Unit number already exists' });
            }
        }
        const [unit] = await (0, database_1.default)('units')
            .where({ id })
            .update({
            unit_number,
            unit_name,
            unit_type,
            group_id,
            status
        })
            .returning('*');
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        return res.json(unit);
    }
    catch (error) {
        console.error('Update unit error:', error);
        return res.status(500).json({ error: 'Failed to update unit' });
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await (0, database_1.default)('units')
            .select('units.*', 'unit_groups.group_name')
            .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
            .where('units.id', id)
            .first();
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        return res.json(unit);
    }
    catch (error) {
        console.error('Get unit error:', error);
        return res.status(500).json({ error: 'Failed to get unit' });
    }
});
router.patch('/:id/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const [unit] = await (0, database_1.default)('units')
            .where({ id })
            .update({ status })
            .returning('*');
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        return res.json(unit);
    }
    catch (error) {
        console.error('Update unit status error:', error);
        return res.status(500).json({ error: 'Failed to update unit status' });
    }
});
router.patch('/:id/location', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, accuracy } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        const [unit] = await (0, database_1.default)('units')
            .where({ id })
            .update({
            current_latitude: latitude,
            current_longitude: longitude,
            current_accuracy: accuracy || null,
            last_location_update: database_1.default.fn.now()
        })
            .returning('*');
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        return res.json(unit);
    }
    catch (error) {
        console.error('Update unit location error:', error);
        return res.status(500).json({ error: 'Failed to update unit location' });
    }
});
router.get('/available', auth_1.authenticateToken, async (_req, res) => {
    try {
        const availableUnits = await (0, database_1.default)('units')
            .select('units.*', 'unit_groups.group_name')
            .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
            .where({ status: 'available', is_active: true })
            .orderBy('units.unit_number');
        return res.json(availableUnits);
    }
    catch (error) {
        console.error('Get available units error:', error);
        return res.status(500).json({ error: 'Failed to get available units' });
    }
});
exports.default = router;
//# sourceMappingURL=units.js.map
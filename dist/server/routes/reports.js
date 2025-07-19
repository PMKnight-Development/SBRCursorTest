"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'supervisor']), async (_req, res) => {
    try {
        const reports = await (0, database_1.default)('reports')
            .select('*')
            .orderBy('created_at', 'desc');
        return res.json(reports);
    }
    catch (error) {
        console.error('Get reports error:', error);
        return res.status(500).json({ error: 'Failed to get reports' });
    }
});
router.get('/calls-summary', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'supervisor']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = (0, database_1.default)('calls').select('call_type', database_1.default.raw('COUNT(*) as total_calls'), database_1.default.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_calls'), database_1.default.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled_calls'), database_1.default.raw('AVG(CASE WHEN status = \'completed\' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/60 END) as avg_response_time'));
        if (startDate && endDate) {
            query = query.whereBetween('created_at', [startDate, endDate]);
        }
        const summary = await query
            .groupBy('call_type')
            .orderBy('total_calls', 'desc');
        return res.json(summary);
    }
    catch (error) {
        console.error('Generate calls summary error:', error);
        return res.status(500).json({ error: 'Failed to generate calls summary' });
    }
});
router.get('/unit-activity', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'supervisor']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = (0, database_1.default)('units')
            .select('units.unit_number', 'units.unit_type', database_1.default.raw('COUNT(calls.id) as total_calls'), database_1.default.raw('COUNT(CASE WHEN calls.status = \'completed\' THEN 1 END) as completed_calls'), database_1.default.raw('AVG(CASE WHEN calls.status = \'completed\' THEN EXTRACT(EPOCH FROM (calls.updated_at - calls.created_at))/60 END) as avg_response_time'))
            .leftJoin('calls', 'units.id', 'calls.assigned_unit_id');
        if (startDate && endDate) {
            query = query.whereBetween('calls.created_at', [startDate, endDate]);
        }
        const activity = await query
            .groupBy('units.id', 'units.unit_number', 'units.unit_type')
            .orderBy('total_calls', 'desc');
        return res.json(activity);
    }
    catch (error) {
        console.error('Generate unit activity error:', error);
        return res.status(500).json({ error: 'Failed to generate unit activity report' });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'supervisor']), async (req, res) => {
    try {
        const { title, description, reportData, reportType } = req.body;
        const [reportId] = await (0, database_1.default)('reports').insert({
            title,
            description,
            report_data: JSON.stringify(reportData),
            report_type: reportType,
            created_by: req.user.id
        }).returning('id');
        const newReport = await (0, database_1.default)('reports').where({ id: reportId }).first();
        return res.status(201).json(newReport);
    }
    catch (error) {
        console.error('Save report error:', error);
        return res.status(500).json({ error: 'Failed to save report' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map
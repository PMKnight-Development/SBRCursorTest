"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const protocolService_1 = __importDefault(require("../services/protocolService"));
const router = (0, express_1.Router)();
router.get('/workflow/:callTypeId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { callTypeId } = req.params;
        if (!callTypeId) {
            return res.status(400).json({ error: 'Call type ID is required' });
        }
        const workflow = await protocolService_1.default.getProtocolWorkflow(callTypeId);
        if (!workflow) {
            return res.status(404).json({ error: 'Protocol workflow not found' });
        }
        return res.json(workflow);
    }
    catch (error) {
        console.error('Get protocol workflow error:', error);
        return res.status(500).json({ error: 'Failed to get protocol workflow' });
    }
});
router.post('/process', auth_1.authenticateToken, async (req, res) => {
    try {
        const { call_id, answers } = req.body;
        if (!call_id || !answers) {
            return res.status(400).json({ error: 'Call ID and answers are required' });
        }
        const result = await protocolService_1.default.processCallProtocol(call_id, answers);
        return res.json(result);
    }
    catch (error) {
        console.error('Process protocol error:', error);
        return res.status(500).json({ error: 'Failed to process protocol' });
    }
});
router.get('/statistics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { call_type_id, start_date, end_date } = req.query;
        const dateRange = start_date && end_date ? {
            start: new Date(start_date),
            end: new Date(end_date)
        } : undefined;
        const stats = await protocolService_1.default.getProtocolStatistics(call_type_id, dateRange);
        return res.json(stats);
    }
    catch (error) {
        console.error('Get protocol statistics error:', error);
        return res.status(500).json({ error: 'Failed to get protocol statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=protocol.js.map
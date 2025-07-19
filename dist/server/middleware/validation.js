"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = exports.validateUnit = exports.validateCall = void 0;
const validateCall = (req, res, next) => {
    const { callType, location, description, priority } = req.body;
    if (!callType || !location || !description) {
        return res.status(400).json({ error: 'Call type, location, and description are required' });
    }
    if (priority && !['low', 'medium', 'high', 'emergency'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority level' });
    }
    return next();
};
exports.validateCall = validateCall;
const validateUnit = (req, res, next) => {
    const { unitNumber, unitType, status } = req.body;
    if (!unitNumber || !unitType) {
        return res.status(400).json({ error: 'Unit number and type are required' });
    }
    if (status && !['available', 'busy', 'out-of-service'].includes(status)) {
        return res.status(400).json({ error: 'Invalid unit status' });
    }
    return next();
};
exports.validateUnit = validateUnit;
const validateUser = (req, res, next) => {
    const { username, email, role } = req.body;
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }
    if (role && !['admin', 'dispatcher', 'supervisor'].includes(role)) {
        return res.status(400).json({ error: 'Invalid user role' });
    }
    return next();
};
exports.validateUser = validateUser;
//# sourceMappingURL=validation.js.map
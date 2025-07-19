"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCallNumber = generateCallNumber;
exports.validateCallNumber = validateCallNumber;
exports.parseCallNumber = parseCallNumber;
const database_1 = require("../../config/database");
const logger_1 = require("./logger");
async function generateCallNumber() {
    try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const result = await (0, database_1.db)('calls')
            .select('call_number')
            .where('call_number', 'like', `${dateString}-%`)
            .orderBy('call_number', 'desc')
            .first();
        let sequence = 1;
        if (result) {
            const lastSequence = parseInt(result.call_number.split('-')[3]);
            sequence = lastSequence + 1;
        }
        const formattedSequence = sequence.toString().padStart(3, '0');
        const callNumber = `${dateString}-${formattedSequence}`;
        logger_1.logger.debug(`Generated call number: ${callNumber}`);
        return callNumber;
    }
    catch (error) {
        logger_1.logger.error('Error generating call number:', error);
        throw new Error('Failed to generate call number');
    }
}
function validateCallNumber(callNumber) {
    const pattern = /^\d{4}-\d{2}-\d{2}-\d{3}$/;
    return pattern.test(callNumber);
}
function parseCallNumber(callNumber) {
    if (!validateCallNumber(callNumber)) {
        return null;
    }
    const parts = callNumber.split('-');
    const dateString = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const sequence = parseInt(parts[3] || '0');
    return {
        date: new Date(dateString),
        sequence
    };
}
//# sourceMappingURL=callNumberGenerator.js.map
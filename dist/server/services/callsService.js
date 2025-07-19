"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsService = void 0;
const database_1 = require("../../config/database");
const logger_1 = require("../utils/logger");
const types_1 = require("../../types");
const callNumberGenerator_1 = require("../utils/callNumberGenerator");
class CallsService {
    async createCall(callData, dispatcherId) {
        try {
            const callNumber = await (0, callNumberGenerator_1.generateCallNumber)();
            const call = {
                callNumber,
                callTypeId: callData.callTypeId,
                priority: callData.priority,
                status: types_1.CallStatus.PENDING,
                location: callData.location,
                callerInfo: callData.callerInfo,
                description: callData.description,
                assignedUnits: callData.assignedUnits || [],
                dispatcherId,
            };
            const [newCall] = await (0, database_1.db)('calls')
                .insert(call)
                .returning('*');
            await this.createCallUpdate(newCall.id, dispatcherId, types_1.UpdateType.GENERAL_UPDATE, 'Call created');
            if (callData.assignedUnits && callData.assignedUnits.length > 0) {
                await this.assignUnitsToCall(newCall.id, callData.assignedUnits, dispatcherId);
            }
            logger_1.logger.info(`Call created: ${callNumber} by dispatcher ${dispatcherId}`);
            return newCall;
        }
        catch (error) {
            logger_1.logger.error('Error creating call:', error);
            throw new Error('Failed to create call');
        }
    }
    async updateCall(callId, updateData, userId) {
        try {
            const existingCall = await this.getCallById(callId);
            if (!existingCall) {
                throw new Error('Call not found');
            }
            const updateFields = {};
            let updateDescription = '';
            if (updateData.callTypeId && updateData.callTypeId !== existingCall.callTypeId) {
                updateFields.callTypeId = updateData.callTypeId;
                updateDescription += 'Call type changed. ';
            }
            if (updateData.priority && updateData.priority !== existingCall.priority) {
                updateFields.priority = updateData.priority;
                updateDescription += 'Priority changed. ';
            }
            if (updateData.location && JSON.stringify(updateData.location) !== JSON.stringify(existingCall.location)) {
                updateFields.location = updateData.location;
                updateDescription += 'Location updated. ';
            }
            if (updateData.callerInfo && JSON.stringify(updateData.callerInfo) !== JSON.stringify(existingCall.callerInfo)) {
                updateFields.callerInfo = updateData.callerInfo;
                updateDescription += 'Caller information updated. ';
            }
            if (updateData.description && updateData.description !== existingCall.description) {
                updateFields.description = updateData.description;
                updateDescription += 'Description updated. ';
            }
            if (updateData.status && updateData.status !== existingCall.status) {
                updateFields.status = updateData.status;
                updateDescription += `Status changed to ${updateData.status}. `;
            }
            if (updateData.assignedUnits) {
                const currentUnits = existingCall.assignedUnits || [];
                const newUnits = updateData.assignedUnits;
                if (JSON.stringify(currentUnits.sort()) !== JSON.stringify(newUnits.sort())) {
                    updateFields.assignedUnits = newUnits;
                    updateDescription += 'Unit assignment updated. ';
                    await this.handleUnitAssignmentChanges(callId, currentUnits, newUnits, userId);
                }
            }
            if (Object.keys(updateFields).length === 0) {
                return existingCall;
            }
            updateFields.updatedAt = new Date();
            const [updatedCall] = await (0, database_1.db)('calls')
                .where({ id: callId })
                .update(updateFields)
                .returning('*');
            if (updateDescription.trim()) {
                await this.createCallUpdate(callId, userId, types_1.UpdateType.GENERAL_UPDATE, updateDescription.trim());
            }
            logger_1.logger.info(`Call updated: ${updatedCall.callNumber} by user ${userId}`);
            return updatedCall;
        }
        catch (error) {
            logger_1.logger.error('Error updating call:', error);
            throw new Error('Failed to update call');
        }
    }
    async getCallById(callId) {
        try {
            const call = await (0, database_1.db)('calls')
                .select('*')
                .where({ id: callId })
                .first();
            return call || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting call by ID:', error);
            throw new Error('Failed to get call');
        }
    }
    async searchCalls(params) {
        try {
            let query = (0, database_1.db)('calls')
                .select('*')
                .orderBy('created_at', 'desc');
            if (params.startDate) {
                query = query.where('created_at', '>=', params.startDate);
            }
            if (params.endDate) {
                query = query.where('created_at', '<=', params.endDate);
            }
            if (params.status && params.status.length > 0) {
                query = query.whereIn('status', params.status);
            }
            if (params.priority && params.priority.length > 0) {
                query = query.whereIn('priority', params.priority);
            }
            if (params.callTypeIds && params.callTypeIds.length > 0) {
                query = query.whereIn('call_type_id', params.callTypeIds);
            }
            if (params.unitIds && params.unitIds.length > 0) {
                query = query.whereRaw("assigned_units ?| array[?]::text[]", [params.unitIds]);
            }
            if (params.dispatcherId) {
                query = query.where({ dispatcher_id: params.dispatcherId });
            }
            const countQuery = query.clone();
            const total = await countQuery.count('* as count').first();
            if (params.limit) {
                query = query.limit(params.limit);
            }
            if (params.offset) {
                query = query.offset(params.offset);
            }
            const calls = await query;
            return {
                calls,
                total: total ? parseInt(total['count']) : 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching calls:', error);
            throw new Error('Failed to search calls');
        }
    }
    async getActiveCalls() {
        try {
            const activeStatuses = [types_1.CallStatus.PENDING, types_1.CallStatus.DISPATCHED, types_1.CallStatus.ENROUTE, types_1.CallStatus.ON_SCENE];
            const calls = await (0, database_1.db)('calls')
                .select('*')
                .whereIn('status', activeStatuses)
                .orderBy('priority', 'desc')
                .orderBy('created_at', 'asc');
            return calls;
        }
        catch (error) {
            logger_1.logger.error('Error getting active calls:', error);
            throw new Error('Failed to get active calls');
        }
    }
    async closeCall(callId, userId, notes) {
        try {
            const call = await this.getCallById(callId);
            if (!call) {
                throw new Error('Call not found');
            }
            if (call.status === types_1.CallStatus.CLEARED) {
                throw new Error('Call is already closed');
            }
            const updateData = {
                status: types_1.CallStatus.CLEARED,
                closedAt: new Date(),
                clearedTime: new Date(),
                updatedAt: new Date()
            };
            const [updatedCall] = await (0, database_1.db)('calls')
                .where({ id: callId })
                .update(updateData)
                .returning('*');
            const updateDescription = notes ? `Call closed. Notes: ${notes}` : 'Call closed';
            await this.createCallUpdate(callId, userId, types_1.UpdateType.STATUS_CHANGE, updateDescription);
            if (call.assignedUnits && call.assignedUnits.length > 0) {
                await this.releaseUnitsFromCall(callId, call.assignedUnits, userId);
            }
            logger_1.logger.info(`Call closed: ${call.callNumber} by user ${userId}`);
            return updatedCall;
        }
        catch (error) {
            logger_1.logger.error('Error closing call:', error);
            throw new Error('Failed to close call');
        }
    }
    async assignUnitsToCall(callId, unitIds, userId) {
        try {
            await (0, database_1.db)('calls')
                .where({ id: callId })
                .update({
                assigned_units: unitIds,
                updated_at: new Date()
            });
            await (0, database_1.db)('units')
                .whereIn('id', unitIds)
                .update({
                status: types_1.UnitStatus.DISPATCHED,
                assigned_call_id: callId,
                last_status_update: new Date()
            });
            await this.createCallUpdate(callId, userId, types_1.UpdateType.UNIT_ASSIGNMENT, `Units assigned: ${unitIds.join(', ')}`);
            logger_1.logger.info(`Units assigned to call ${callId}: ${unitIds.join(', ')}`);
        }
        catch (error) {
            logger_1.logger.error('Error assigning units to call:', error);
            throw new Error('Failed to assign units to call');
        }
    }
    async releaseUnitsFromCall(callId, unitIds, userId) {
        try {
            await (0, database_1.db)('units')
                .whereIn('id', unitIds)
                .update({
                status: types_1.UnitStatus.AVAILABLE,
                assigned_call_id: null,
                last_status_update: new Date()
            });
            await this.createCallUpdate(callId, userId, types_1.UpdateType.UNIT_ASSIGNMENT, `Units released: ${unitIds.join(', ')}`);
            logger_1.logger.info(`Units released from call ${callId}: ${unitIds.join(', ')}`);
        }
        catch (error) {
            logger_1.logger.error('Error releasing units from call:', error);
            throw new Error('Failed to release units from call');
        }
    }
    async createCallUpdate(callId, userId, updateType, description) {
        try {
            await (0, database_1.db)('call_updates').insert({
                call_id: callId,
                user_id: userId,
                update_type: updateType,
                description,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating call update:', error);
        }
    }
    async handleUnitAssignmentChanges(callId, currentUnits, newUnits, userId) {
        const unitsToRelease = currentUnits.filter(unitId => !newUnits.includes(unitId));
        const unitsToAssign = newUnits.filter(unitId => !currentUnits.includes(unitId));
        if (unitsToRelease.length > 0) {
            await this.releaseUnitsFromCall(callId, unitsToRelease, userId);
        }
        if (unitsToAssign.length > 0) {
            await this.assignUnitsToCall(callId, unitsToAssign, userId);
        }
    }
    async getCallUpdates(callId) {
        try {
            const updates = await (0, database_1.db)('call_updates')
                .select('*')
                .where({ call_id: callId })
                .orderBy('created_at', 'desc');
            return updates;
        }
        catch (error) {
            logger_1.logger.error('Error getting call updates:', error);
            throw new Error('Failed to get call updates');
        }
    }
    async getCallStats(startDate, endDate) {
        try {
            const stats = await (0, database_1.db)('calls')
                .select(database_1.db.raw('COUNT(*) as total_calls'), database_1.db.raw('COUNT(CASE WHEN status = ?) as active_calls', [types_1.CallStatus.CLEARED]), database_1.db.raw('COUNT(CASE WHEN priority = ?) as emergency_calls', [types_1.CallPriority.EMERGENCY]), database_1.db.raw('AVG(EXTRACT(EPOCH FROM (cleared_time - created_at))/60) as avg_response_time'))
                .whereBetween('created_at', [startDate, endDate])
                .first();
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting call statistics:', error);
            throw new Error('Failed to get call statistics');
        }
    }
}
exports.CallsService = CallsService;
exports.default = new CallsService();
//# sourceMappingURL=callsService.js.map
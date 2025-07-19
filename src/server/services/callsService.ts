import { db } from '../../config/database';
import { logger } from '../utils/logger';
import { 
  Call, 
  CreateCallRequest, 
  UpdateCallRequest, 
  CallStatus, 
  CallPriority,
  CallSearchParams,
  UnitStatus,
  CallUpdate,
  UpdateType
} from '../../types';
import { generateCallNumber } from '../utils/callNumberGenerator';

export class CallsService {

  /**
   * Create a new call for service
   */
  async createCall(callData: CreateCallRequest, dispatcherId: string): Promise<Call> {
    try {
      const callNumber = await generateCallNumber();
      
      const call: any = {
        call_number: callNumber, // Use snake_case for DB insert
        call_type_id: callData.callTypeId,
        priority: callData.priority,
        status: CallStatus.PENDING,
        location: callData.location,
        caller_info: callData.callerInfo,
        description: callData.description,
        assigned_units: callData.assignedUnits || [],
        dispatcher_id: dispatcherId,
      };

      const [newCall] = await db('calls')
        .insert(call)
        .returning('*');

      // Create initial call update
      await this.createCallUpdate(newCall.id, dispatcherId, UpdateType.GENERAL_UPDATE, 'Call created');

      // Assign units if provided
      if (callData.assignedUnits && callData.assignedUnits.length > 0) {
        await this.assignUnitsToCall(newCall.id, callData.assignedUnits, dispatcherId);
      }

      // TODO: Implement WebSocket and notification services
      // this.webSocketService.emitToAll('call_created', newCall);
      // await this.notificationService.sendCallNotifications(newCall);

      logger.info(`Call created: ${callNumber} by dispatcher ${dispatcherId}`);
      // Map call_number to callNumber for API response, but do not reformat
      const mappedCall = {
        ...newCall,
        callNumber: newCall.call_number,
      };
      return mappedCall;
    } catch (error) {
      logger.error('Error creating call:', error);
      throw new Error('Failed to create call');
    }
  }

  /**
   * Update an existing call
   */
  async updateCall(callId: string, updateData: UpdateCallRequest, userId: string): Promise<Call> {
    try {
      const existingCall = await this.getCallById(callId);
      if (!existingCall) {
        throw new Error('Call not found');
      }

      const updateFields: Partial<Call> = {};
      let updateDescription = '';

      // Track what's being updated
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

      // Update assigned units if provided
      if (updateData.assignedUnits) {
        const currentUnits = existingCall.assignedUnits || [];
        const newUnits = updateData.assignedUnits;
        
        if (JSON.stringify(currentUnits.sort()) !== JSON.stringify(newUnits.sort())) {
          updateFields.assignedUnits = newUnits;
          updateDescription += 'Unit assignment updated. ';
          
          // Handle unit assignments
          await this.handleUnitAssignmentChanges(callId, currentUnits, newUnits, userId);
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return existingCall;
      }

      updateFields.updatedAt = new Date();

      const [updatedCall] = await db('calls')
        .where({ id: callId })
        .update(updateFields)
        .returning('*');

      // Create call update record
      if (updateDescription.trim()) {
        await this.createCallUpdate(callId, userId, UpdateType.GENERAL_UPDATE, updateDescription.trim());
      }

      // TODO: Implement WebSocket and notification services
      // this.webSocketService.emitToAll('call_updated', updatedCall);
      // if (updateData.status && updateData.status !== existingCall.status) {
      //   await this.notificationService.sendStatusChangeNotification(updatedCall, existingCall.status);
      // }

      logger.info(`Call updated: ${updatedCall.callNumber} by user ${userId}`);
      return updatedCall;
    } catch (error) {
      logger.error('Error updating call:', error);
      throw new Error('Failed to update call');
    }
  }

  /**
   * Get call by ID with related data
   */
  async getCallById(callId: string): Promise<Call | null> {
    try {
      const call = await db('calls')
        .select('*')
        .where({ id: callId })
        .first();

      return call || null;
    } catch (error) {
      logger.error('Error getting call by ID:', error);
      throw new Error('Failed to get call');
    }
  }

  /**
   * Search calls with filters
   */
  async searchCalls(params: CallSearchParams): Promise<{ calls: Call[]; total: number }> {
    try {
      let query = db('calls')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
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

      // Get total count
      const countQuery = query.clone();
      const total = await countQuery.count('* as count').first();

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.offset(params.offset);
      }

      const calls = await query;

      return {
        calls,
        total: total ? parseInt(total['count'] as string) : 0
      };
    } catch (error) {
      logger.error('Error searching calls:', error);
      throw new Error('Failed to search calls');
    }
  }

  /**
   * Get active calls
   */
  async getActiveCalls(): Promise<Call[]> {
    try {
      const activeStatuses = [CallStatus.PENDING, CallStatus.DISPATCHED, CallStatus.ENROUTE, CallStatus.ON_SCENE];
      
      const calls = await db('calls')
        .select('*')
        .whereIn('status', activeStatuses)
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc');

      return calls;
    } catch (error) {
      logger.error('Error getting active calls:', error);
      throw new Error('Failed to get active calls');
    }
  }

  /**
   * Close a call
   */
  async closeCall(callId: string, userId: string, notes?: string): Promise<Call> {
    try {
      const call = await this.getCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.status === CallStatus.CLEARED) {
        throw new Error('Call is already closed');
      }

      const updateData: Partial<Call> = {
        status: CallStatus.CLEARED,
        closedAt: new Date(),
        clearedTime: new Date(),
        updatedAt: new Date()
      };

      const [updatedCall] = await db('calls')
        .where({ id: callId })
        .update(updateData)
        .returning('*');

      // Create call update
      const updateDescription = notes ? `Call closed. Notes: ${notes}` : 'Call closed';
      await this.createCallUpdate(callId, userId, UpdateType.STATUS_CHANGE, updateDescription);

      // Release assigned units
      if (call.assignedUnits && call.assignedUnits.length > 0) {
        await this.releaseUnitsFromCall(callId, call.assignedUnits, userId);
      }

      // TODO: Implement WebSocket service
      // this.webSocketService.emitToAll('call_closed', updatedCall);

      logger.info(`Call closed: ${call.callNumber} by user ${userId}`);
      return updatedCall;
    } catch (error) {
      logger.error('Error closing call:', error);
      throw new Error('Failed to close call');
    }
  }

  /**
   * Assign units to a call
   */
  async assignUnitsToCall(callId: string, unitIds: string[], userId: string): Promise<void> {
    try {
      // Update call with new unit assignments
      await db('calls')
        .where({ id: callId })
        .update({ 
          assigned_units: unitIds,
          updated_at: new Date()
        });

      // Update unit statuses
      await db('units')
        .whereIn('id', unitIds)
        .update({
          status: UnitStatus.DISPATCHED,
          assigned_call_id: callId,
          last_status_update: new Date()
        });

      // Create call update
      await this.createCallUpdate(callId, userId, UpdateType.UNIT_ASSIGNMENT, `Units assigned: ${unitIds.join(', ')}`);

      // TODO: Implement WebSocket service
      // const units = await db('units').whereIn('id', unitIds);
      // units.forEach(unit => {
      //   this.webSocketService.emitToAll('unit_status_changed', unit);
      // });

      logger.info(`Units assigned to call ${callId}: ${unitIds.join(', ')}`);
    } catch (error) {
      logger.error('Error assigning units to call:', error);
      throw new Error('Failed to assign units to call');
    }
  }

  /**
   * Release units from a call
   */
  async releaseUnitsFromCall(callId: string, unitIds: string[], userId: string): Promise<void> {
    try {
      // Update units to available status
      await db('units')
        .whereIn('id', unitIds)
        .update({
          status: UnitStatus.AVAILABLE,
          assigned_call_id: null,
          last_status_update: new Date()
        });

      // Create call update
      await this.createCallUpdate(callId, userId, UpdateType.UNIT_ASSIGNMENT, `Units released: ${unitIds.join(', ')}`);

      // TODO: Implement WebSocket service
      // const units = await db('units').whereIn('id', unitIds);
      // units.forEach(unit => {
      //   this.webSocketService.emitToAll('unit_status_changed', unit);
      // });

      logger.info(`Units released from call ${callId}: ${unitIds.join(', ')}`);
    } catch (error) {
      logger.error('Error releasing units from call:', error);
      throw new Error('Failed to release units from call');
    }
  }

  /**
   * Create a call update record
   */
  private async createCallUpdate(
    callId: string, 
    userId: string, 
    updateType: UpdateType, 
    description: string
  ): Promise<void> {
    try {
      await db('call_updates').insert({
        call_id: callId,
        user_id: userId,
        update_type: updateType,
        description,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error creating call update:', error);
    }
  }

  /**
   * Handle unit assignment changes
   */
  private async handleUnitAssignmentChanges(
    callId: string,
    currentUnits: string[],
    newUnits: string[],
    userId: string
  ): Promise<void> {
    const unitsToRelease = currentUnits.filter(unitId => !newUnits.includes(unitId));
    const unitsToAssign = newUnits.filter(unitId => !currentUnits.includes(unitId));

    if (unitsToRelease.length > 0) {
      await this.releaseUnitsFromCall(callId, unitsToRelease, userId);
    }

    if (unitsToAssign.length > 0) {
      await this.assignUnitsToCall(callId, unitsToAssign, userId);
    }
  }

  /**
   * Get call updates
   */
  async getCallUpdates(callId: string): Promise<CallUpdate[]> {
    try {
      const updates = await db('call_updates')
        .select('*')
        .where({ call_id: callId })
        .orderBy('created_at', 'desc');

      return updates;
    } catch (error) {
      logger.error('Error getting call updates:', error);
      throw new Error('Failed to get call updates');
    }
  }

  /**
   * Get call statistics
   */
  async getCallStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const stats = await db('calls')
        .select(
          db.raw('COUNT(*) as total_calls'),
          db.raw('COUNT(CASE WHEN status = ?) as active_calls', [CallStatus.CLEARED]),
          db.raw('COUNT(CASE WHEN priority = ?) as emergency_calls', [CallPriority.EMERGENCY]),
          db.raw('AVG(EXTRACT(EPOCH FROM (cleared_time - created_at))/60) as avg_response_time')
        )
        .whereBetween('created_at', [startDate, endDate])
        .first();

      return stats;
    } catch (error) {
      logger.error('Error getting call statistics:', error);
      throw new Error('Failed to get call statistics');
    }
  }
}

export default new CallsService(); 
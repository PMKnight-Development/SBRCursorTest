import { Call, CreateCallRequest, UpdateCallRequest, CallSearchParams, CallUpdate } from '../../types';
export declare class CallsService {
    createCall(callData: CreateCallRequest, dispatcherId: string): Promise<Call>;
    updateCall(callId: string, updateData: UpdateCallRequest, userId: string): Promise<Call>;
    getCallById(callId: string): Promise<Call | null>;
    searchCalls(params: CallSearchParams): Promise<{
        calls: Call[];
        total: number;
    }>;
    getActiveCalls(): Promise<Call[]>;
    closeCall(callId: string, userId: string, notes?: string): Promise<Call>;
    assignUnitsToCall(callId: string, unitIds: string[], userId: string): Promise<void>;
    releaseUnitsFromCall(callId: string, unitIds: string[], userId: string): Promise<void>;
    private createCallUpdate;
    private handleUnitAssignmentChanges;
    getCallUpdates(callId: string): Promise<CallUpdate[]>;
    getCallStats(startDate: Date, endDate: Date): Promise<any>;
}
declare const _default: CallsService;
export default _default;
//# sourceMappingURL=callsService.d.ts.map
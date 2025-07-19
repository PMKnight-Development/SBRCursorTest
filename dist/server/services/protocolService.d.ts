interface ProtocolQuestion {
    id: string;
    call_type_id: string;
    question: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
    required: boolean;
    options?: string[];
    order: number;
    conditional_logic?: {
        depends_on: string;
        condition: string;
        value: any;
    };
}
interface ProtocolWorkflow {
    id: string;
    call_type_id: string;
    name: string;
    description: string;
    questions: ProtocolQuestion[];
    priority_override?: number;
    unit_recommendations?: string[];
    response_plan?: string;
}
interface CallResponse {
    call_id: string;
    answers: Record<string, any>;
    calculated_priority: number;
    recommended_units: string[];
    response_plan: string;
    protocol_completed: boolean;
}
declare class ProtocolService {
    getProtocolWorkflow(callTypeId: string): Promise<ProtocolWorkflow | null>;
    processCallProtocol(callId: string, answers: Record<string, any>): Promise<CallResponse>;
    private validateAnswers;
    private evaluateConditionalLogic;
    private validateAnswerFormat;
    private calculatePriority;
    private determineRecommendedUnits;
    private generateResponsePlan;
    private parseResponsePlan;
    getProtocolStatistics(callTypeId?: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    private calculateAverageCompletionTime;
    private calculatePriorityDistribution;
    private calculateMostCommonAnswers;
}
export declare const protocolService: ProtocolService;
export default protocolService;
//# sourceMappingURL=protocolService.d.ts.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protocolService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = require("../utils/logger");
class ProtocolService {
    async getProtocolWorkflow(callTypeId) {
        try {
            const callType = await (0, database_1.default)('call_types')
                .where({ id: callTypeId })
                .first();
            if (!callType) {
                return null;
            }
            const questions = await (0, database_1.default)('protocol_questions')
                .where({ call_type_id: callTypeId })
                .orderBy('order', 'asc');
            return {
                id: callType.id,
                call_type_id: callTypeId,
                name: callType.name,
                description: callType.description || '',
                questions: questions.map(q => ({
                    id: q.id,
                    call_type_id: q.call_type_id,
                    question: q.question,
                    type: q.type,
                    required: q.required,
                    options: q.options,
                    order: q.order,
                    conditional_logic: q.conditional_logic
                })),
                priority_override: callType.priority,
                unit_recommendations: callType.response_plan ? this.parseResponsePlan(callType.response_plan) : [],
                response_plan: callType.response_plan
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocol workflow:', error);
            return null;
        }
    }
    async processCallProtocol(callId, answers) {
        try {
            const call = await (0, database_1.default)('calls')
                .where({ id: callId })
                .first();
            if (!call) {
                throw new Error('Call not found');
            }
            const workflow = await this.getProtocolWorkflow(call.call_type_id);
            if (!workflow) {
                throw new Error('Protocol workflow not found');
            }
            const validationErrors = this.validateAnswers(workflow.questions, answers);
            if (validationErrors.length > 0) {
                throw new Error(`Protocol validation failed: ${validationErrors.join(', ')}`);
            }
            const calculatedPriority = this.calculatePriority(workflow, answers, call.priority);
            const recommendedUnits = this.determineRecommendedUnits(workflow, answers);
            const responsePlan = this.generateResponsePlan(workflow, answers);
            await (0, database_1.default)('call_protocol_answers').insert({
                call_id: callId,
                answers: JSON.stringify(answers),
                calculated_priority: calculatedPriority,
                recommended_units: JSON.stringify(recommendedUnits),
                response_plan: responsePlan,
                protocol_completed: true,
                completed_at: new Date()
            });
            if (calculatedPriority !== call.priority) {
                await (0, database_1.default)('calls')
                    .where({ id: callId })
                    .update({
                    priority: calculatedPriority,
                    updated_at: new Date()
                });
            }
            return {
                call_id: callId,
                answers,
                calculated_priority: calculatedPriority,
                recommended_units: recommendedUnits,
                response_plan: responsePlan,
                protocol_completed: true
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process call protocol:', error);
            throw error;
        }
    }
    validateAnswers(questions, answers) {
        const errors = [];
        for (const question of questions) {
            if (question.conditional_logic) {
                const shouldShow = this.evaluateConditionalLogic(question.conditional_logic, answers);
                if (!shouldShow)
                    continue;
            }
            if (question.required && !answers[question.id]) {
                errors.push(`Question "${question.question}" is required`);
                continue;
            }
            if (answers[question.id]) {
                const validationError = this.validateAnswerFormat(question, answers[question.id]);
                if (validationError) {
                    errors.push(validationError);
                }
            }
        }
        return errors;
    }
    evaluateConditionalLogic(logic, answers) {
        const { depends_on, condition, value } = logic;
        const answer = answers[depends_on];
        switch (condition) {
            case 'equals':
                return answer === value;
            case 'not_equals':
                return answer !== value;
            case 'contains':
                return String(answer).includes(String(value));
            case 'greater_than':
                return Number(answer) > Number(value);
            case 'less_than':
                return Number(answer) < Number(value);
            default:
                return true;
        }
    }
    validateAnswerFormat(question, answer) {
        switch (question.type) {
            case 'number':
                if (isNaN(Number(answer))) {
                    return `Question "${question.question}" requires a number`;
                }
                break;
            case 'boolean':
                if (typeof answer !== 'boolean' && !['true', 'false', 'yes', 'no'].includes(String(answer).toLowerCase())) {
                    return `Question "${question.question}" requires yes/no answer`;
                }
                break;
            case 'select':
                if (question.options && !question.options.includes(answer)) {
                    return `Question "${question.question}" requires selection from available options`;
                }
                break;
            case 'multi_select':
                if (Array.isArray(answer)) {
                    for (const item of answer) {
                        if (question.options && !question.options.includes(item)) {
                            return `Question "${question.question}" contains invalid option: ${item}`;
                        }
                    }
                }
                else {
                    return `Question "${question.question}" requires multiple selections`;
                }
                break;
        }
        return null;
    }
    calculatePriority(workflow, answers, basePriority) {
        let priority = basePriority;
        for (const question of workflow.questions) {
            if (answers[question.id]) {
                const emergencyKeywords = ['unconscious', 'not breathing', 'cardiac arrest', 'bleeding', 'fire', 'explosion'];
                const answerStr = String(answers[question.id]).toLowerCase();
                if (emergencyKeywords.some(keyword => answerStr.includes(keyword))) {
                    priority = Math.min(priority, 1);
                }
                const urgentKeywords = ['pain', 'injury', 'accident', 'fall', 'medical'];
                if (urgentKeywords.some(keyword => answerStr.includes(keyword))) {
                    priority = Math.min(priority, 2);
                }
            }
        }
        return priority;
    }
    determineRecommendedUnits(workflow, answers) {
        const recommendations = new Set();
        if (workflow.unit_recommendations) {
            workflow.unit_recommendations.forEach(unit => recommendations.add(unit));
        }
        for (const question of workflow.questions) {
            if (answers[question.id]) {
                const answerStr = String(answers[question.id]).toLowerCase();
                if (answerStr.includes('medical') || answerStr.includes('injury') || answerStr.includes('pain')) {
                    recommendations.add('EMS');
                }
                if (answerStr.includes('fire') || answerStr.includes('smoke') || answerStr.includes('burn')) {
                    recommendations.add('Fire');
                }
                if (answerStr.includes('fight') || answerStr.includes('assault') || answerStr.includes('theft')) {
                    recommendations.add('Security');
                }
                if (answerStr.includes('lost') || answerStr.includes('missing') || answerStr.includes('trail')) {
                    recommendations.add('Search_Rescue');
                }
            }
        }
        return Array.from(recommendations);
    }
    generateResponsePlan(workflow, answers) {
        let plan = workflow.response_plan || '';
        for (const question of workflow.questions) {
            if (answers[question.id]) {
                const answerStr = String(answers[question.id]).toLowerCase();
                if (answerStr.includes('unconscious')) {
                    plan += '\n- Check for responsiveness and breathing';
                    plan += '\n- Begin CPR if necessary';
                }
                if (answerStr.includes('bleeding')) {
                    plan += '\n- Apply direct pressure to wound';
                    plan += '\n- Elevate if possible';
                }
                if (answerStr.includes('fire')) {
                    plan += '\n- Ensure scene safety';
                    plan += '\n- Establish fire perimeter';
                }
            }
        }
        return plan;
    }
    parseResponsePlan(responsePlan) {
        const units = [];
        if (responsePlan.toLowerCase().includes('ems'))
            units.push('EMS');
        if (responsePlan.toLowerCase().includes('fire'))
            units.push('Fire');
        if (responsePlan.toLowerCase().includes('security'))
            units.push('Security');
        if (responsePlan.toLowerCase().includes('search') || responsePlan.toLowerCase().includes('rescue')) {
            units.push('Search_Rescue');
        }
        return units;
    }
    async getProtocolStatistics(callTypeId, dateRange) {
        try {
            let query = (0, database_1.default)('call_protocol_answers')
                .select('call_protocol_answers.*', 'calls.call_number', 'call_types.name as call_type_name')
                .leftJoin('calls', 'call_protocol_answers.call_id', 'calls.id')
                .leftJoin('call_types', 'calls.call_type_id', 'call_types.id');
            if (callTypeId) {
                query = query.where('calls.call_type_id', callTypeId);
            }
            if (dateRange) {
                query = query.whereBetween('call_protocol_answers.completed_at', [dateRange.start, dateRange.end]);
            }
            const results = await query.orderBy('call_protocol_answers.completed_at', 'desc');
            return {
                total_protocols: results.length,
                average_completion_time: this.calculateAverageCompletionTime(results),
                priority_distribution: this.calculatePriorityDistribution(results),
                most_common_answers: this.calculateMostCommonAnswers(results)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocol statistics:', error);
            return null;
        }
    }
    calculateAverageCompletionTime(results) {
        if (results.length === 0)
            return 0;
        const totalTime = results.reduce((sum, result) => {
            if (result.start_time && result.completed_at) {
                const startTime = new Date(result.start_time).getTime();
                const completedTime = new Date(result.completed_at).getTime();
                return sum + (completedTime - startTime);
            }
            return sum;
        }, 0);
        return totalTime / results.length;
    }
    calculatePriorityDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            const priority = result.calculated_priority;
            distribution[priority] = (distribution[priority] || 0) + 1;
        });
        return distribution;
    }
    calculateMostCommonAnswers(results) {
        const answerCounts = {};
        results.forEach(result => {
            const answers = JSON.parse(result.answers);
            Object.entries(answers).forEach(([questionId, answer]) => {
                if (!answerCounts[questionId]) {
                    answerCounts[questionId] = {};
                }
                const answerStr = String(answer);
                answerCounts[questionId][answerStr] = (answerCounts[questionId][answerStr] || 0) + 1;
            });
        });
        return answerCounts;
    }
}
exports.protocolService = new ProtocolService();
exports.default = exports.protocolService;
//# sourceMappingURL=protocolService.js.map
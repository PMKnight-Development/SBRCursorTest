import knex from '../../config/database';
import { logger } from '../utils/logger';

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

class ProtocolService {
  async getProtocolWorkflow(callTypeId: string): Promise<ProtocolWorkflow | null> {
    try {
      // Get call type details
      const callType = await knex('call_types')
        .where({ id: callTypeId })
        .first();

      if (!callType) {
        return null;
      }

      // Get protocol questions for this call type
      const questions = await knex('protocol_questions')
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
    } catch (error) {
      logger.error('Failed to get protocol workflow:', error);
      return null;
    }
  }

  async processCallProtocol(callId: string, answers: Record<string, any>): Promise<CallResponse> {
    try {
      const call = await knex('calls')
        .where({ id: callId })
        .first();

      if (!call) {
        throw new Error('Call not found');
      }

      // Get the protocol workflow
      const workflow = await this.getProtocolWorkflow(call.call_type_id);
      if (!workflow) {
        throw new Error('Protocol workflow not found');
      }

      // Validate answers against required questions
      const validationErrors = this.validateAnswers(workflow.questions, answers);
      if (validationErrors.length > 0) {
        throw new Error(`Protocol validation failed: ${validationErrors.join(', ')}`);
      }

      // Calculate priority based on answers
      const calculatedPriority = this.calculatePriority(workflow, answers, call.priority);

      // Determine recommended units
      const recommendedUnits = this.determineRecommendedUnits(workflow, answers);

      // Generate response plan
      const responsePlan = this.generateResponsePlan(workflow, answers);

      // Save protocol answers
      await knex('call_protocol_answers').insert({
        call_id: callId,
        answers: JSON.stringify(answers),
        calculated_priority: calculatedPriority,
        recommended_units: JSON.stringify(recommendedUnits),
        response_plan: responsePlan,
        protocol_completed: true,
        completed_at: new Date()
      });

      // Update call with new priority if different
      if (calculatedPriority !== call.priority) {
        await knex('calls')
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
    } catch (error) {
      logger.error('Failed to process call protocol:', error);
      throw error;
    }
  }

  private validateAnswers(questions: ProtocolQuestion[], answers: Record<string, any>): string[] {
    const errors: string[] = [];

    for (const question of questions) {
      // Check if question should be shown based on conditional logic
      if (question.conditional_logic) {
        const shouldShow = this.evaluateConditionalLogic(question.conditional_logic, answers);
        if (!shouldShow) continue;
      }

      // Check required questions
      if (question.required && !answers[question.id]) {
        errors.push(`Question "${question.question}" is required`);
        continue;
      }

      // Validate answer format
      if (answers[question.id]) {
        const validationError = this.validateAnswerFormat(question, answers[question.id]);
        if (validationError) {
          errors.push(validationError);
        }
      }
    }

    return errors;
  }

  private evaluateConditionalLogic(logic: any, answers: Record<string, any>): boolean {
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

  private validateAnswerFormat(question: ProtocolQuestion, answer: any): string | null {
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
        } else {
          return `Question "${question.question}" requires multiple selections`;
        }
        break;
    }
    return null;
  }

  private calculatePriority(workflow: ProtocolWorkflow, answers: Record<string, any>, basePriority: number): number {
    let priority = basePriority;

    // Priority escalation based on answers
    for (const question of workflow.questions) {
      if (answers[question.id]) {
        // Check for emergency indicators
        const emergencyKeywords = ['unconscious', 'not breathing', 'cardiac arrest', 'bleeding', 'fire', 'explosion'];
        const answerStr = String(answers[question.id]).toLowerCase();
        
        if (emergencyKeywords.some(keyword => answerStr.includes(keyword))) {
          priority = Math.min(priority, 1); // Escalate to highest priority
        }

        // Check for urgent indicators
        const urgentKeywords = ['pain', 'injury', 'accident', 'fall', 'medical'];
        if (urgentKeywords.some(keyword => answerStr.includes(keyword))) {
          priority = Math.min(priority, 2);
        }
      }
    }

    return priority;
  }

  private determineRecommendedUnits(workflow: ProtocolWorkflow, answers: Record<string, any>): string[] {
    const recommendations = new Set<string>();

    // Add base recommendations from workflow
    if (workflow.unit_recommendations) {
      workflow.unit_recommendations.forEach(unit => recommendations.add(unit));
    }

    // Add recommendations based on answers
    for (const question of workflow.questions) {
      if (answers[question.id]) {
        const answerStr = String(answers[question.id]).toLowerCase();
        
        // Medical emergencies
        if (answerStr.includes('medical') || answerStr.includes('injury') || answerStr.includes('pain')) {
          recommendations.add('EMS');
        }

        // Fire emergencies
        if (answerStr.includes('fire') || answerStr.includes('smoke') || answerStr.includes('burn')) {
          recommendations.add('Fire');
        }

        // Security incidents
        if (answerStr.includes('fight') || answerStr.includes('assault') || answerStr.includes('theft')) {
          recommendations.add('Security');
        }

        // Search and rescue
        if (answerStr.includes('lost') || answerStr.includes('missing') || answerStr.includes('trail')) {
          recommendations.add('Search_Rescue');
        }
      }
    }

    return Array.from(recommendations);
  }

  private generateResponsePlan(workflow: ProtocolWorkflow, answers: Record<string, any>): string {
    let plan = workflow.response_plan || '';

    // Customize plan based on answers
    for (const question of workflow.questions) {
      if (answers[question.id]) {
        const answerStr = String(answers[question.id]).toLowerCase();
        
        // Add specific instructions based on answers
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

  private parseResponsePlan(responsePlan: string): string[] {
    // Simple parsing of response plan to extract unit types
    const units: string[] = [];
    
    if (responsePlan.toLowerCase().includes('ems')) units.push('EMS');
    if (responsePlan.toLowerCase().includes('fire')) units.push('Fire');
    if (responsePlan.toLowerCase().includes('security')) units.push('Security');
    if (responsePlan.toLowerCase().includes('search') || responsePlan.toLowerCase().includes('rescue')) {
      units.push('Search_Rescue');
    }
    
    return units;
  }

  async getProtocolStatistics(callTypeId?: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      let query = knex('call_protocol_answers')
        .select(
          'call_protocol_answers.*',
          'calls.call_number',
          'call_types.name as call_type_name'
        )
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
    } catch (error) {
      logger.error('Failed to get protocol statistics:', error);
      return null;
    }
  }

  private calculateAverageCompletionTime(results: any[]): number {
    if (results.length === 0) return 0;
    
    // Calculate average completion time based on start_time and completed_at
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

  private calculatePriorityDistribution(results: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    results.forEach(result => {
      const priority = result.calculated_priority;
      distribution[priority] = (distribution[priority] || 0) + 1;
    });
    
    return distribution;
  }

  private calculateMostCommonAnswers(results: any[]): Record<string, any> {
    const answerCounts: Record<string, Record<string, number>> = {};
    
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

export const protocolService = new ProtocolService();
export default protocolService; 
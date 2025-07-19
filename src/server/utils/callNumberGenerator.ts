import { db } from '../../config/database';
import { logger } from './logger';

/**
 * Generate a unique call number for new calls
 * Format: YEAR-IncidentNumber (e.g., 1)
 */
export async function generateCallNumber(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    // Find the highest incident number for this year, only considering call numbers in the format YEAR-<number>
    const yearPattern = new RegExp(`^${year}-\\d+$`);
    const allCallsThisYear = await db('calls')
      .where('call_number', 'like', `${year}-%`)
      .select('call_number');
    let maxIncidentNumber = 0;
    for (const row of allCallsThisYear) {
      if (typeof row.call_number === 'string' && yearPattern.test(row.call_number)) {
        const incidentNum = parseInt(row.call_number.split('-')[1], 10);
        if (!isNaN(incidentNum) && incidentNum > maxIncidentNumber) {
          maxIncidentNumber = incidentNum;
        }
      }
    }
    const nextIncidentNumber = maxIncidentNumber + 1;
    const callNumber = `${year}-${nextIncidentNumber}`;
    logger.debug(`Generated call number: ${callNumber}`);
    return callNumber;
  } catch (error) {
    logger.error('Error generating call number:', error);
    throw new Error('Failed to generate call number');
  }
}

/**
 * Validate if a call number is in the correct format
 */
export function validateCallNumber(callNumber: string): boolean {
  const pattern = /^\d{4}-\d+$/;
  return pattern.test(callNumber);
}

/**
 * Parse a call number to extract year and incident number
 */
export function parseCallNumber(callNumber: string): { year: number; incidentNumber: number } | null {
  if (!validateCallNumber(callNumber)) {
    return null;
  }
  const parts = callNumber.split('-');
  if (parts.length < 2 || parts[0] === undefined || parts[1] === undefined) {
    return null;
  }
  const year = parseInt(parts[0], 10);
  const incidentNumber = parseInt(parts[1], 10);
  return {
    year,
    incidentNumber
  };
} 
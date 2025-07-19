import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import knex from '../../config/database';

const router = Router();

// Get all reports
router.get('/', authenticateToken, requireRole(['admin', 'supervisor']), async (_req: Request, res: Response) => {
  try {
    const reports = await knex('reports')
      .select('*')
      .orderBy('created_at', 'desc');
    
    return res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Generate calls summary report
router.get('/calls-summary', authenticateToken, requireRole(['admin', 'supervisor']), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = knex('calls').select(
      'call_type',
      knex.raw('COUNT(*) as total_calls'),
      knex.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_calls'),
      knex.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled_calls'),
      knex.raw('AVG(CASE WHEN status = \'completed\' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/60 END) as avg_response_time')
    );
    
    if (startDate && endDate) {
      query = query.whereBetween('created_at', [startDate, endDate]);
    }
    
    const summary = await query
      .groupBy('call_type')
      .orderBy('total_calls', 'desc');
    
    return res.json(summary);
  } catch (error) {
    console.error('Generate calls summary error:', error);
    return res.status(500).json({ error: 'Failed to generate calls summary' });
  }
});

// Generate unit activity report
router.get('/unit-activity', authenticateToken, requireRole(['admin', 'supervisor']), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = knex('units')
      .select(
        'units.unit_number',
        'units.unit_type',
        knex.raw('COUNT(calls.id) as total_calls'),
        knex.raw('COUNT(CASE WHEN calls.status = \'completed\' THEN 1 END) as completed_calls'),
        knex.raw('AVG(CASE WHEN calls.status = \'completed\' THEN EXTRACT(EPOCH FROM (calls.updated_at - calls.created_at))/60 END) as avg_response_time')
      )
      .leftJoin('calls', 'units.id', 'calls.assigned_unit_id');
    
    if (startDate && endDate) {
      query = query.whereBetween('calls.created_at', [startDate, endDate]);
    }
    
    const activity = await query
      .groupBy('units.id', 'units.unit_number', 'units.unit_type')
      .orderBy('total_calls', 'desc');
    
    return res.json(activity);
  } catch (error) {
    console.error('Generate unit activity error:', error);
    return res.status(500).json({ error: 'Failed to generate unit activity report' });
  }
});

// Save custom report
router.post('/', authenticateToken, requireRole(['admin', 'supervisor']), async (req: Request, res: Response) => {
  try {
    const { title, description, reportData, reportType } = req.body;
    
    const [reportId] = await knex('reports').insert({
      title,
      description,
      report_data: JSON.stringify(reportData),
      report_type: reportType,
      created_by: (req as any).user.id
    }).returning('id');
    
    const newReport = await knex('reports').where({ id: reportId }).first();
    return res.status(201).json(newReport);
  } catch (error) {
    console.error('Save report error:', error);
    return res.status(500).json({ error: 'Failed to save report' });
  }
});

export default router; 
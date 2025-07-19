import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import protocolService from '../services/protocolService';

const router = Router();

// Get protocol workflow for a call type
router.get('/workflow/:callTypeId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { callTypeId } = req.params;
    if (!callTypeId) {
      return res.status(400).json({ error: 'Call type ID is required' });
    }
    const workflow = await protocolService.getProtocolWorkflow(callTypeId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Protocol workflow not found' });
    }
    
    return res.json(workflow);
  } catch (error) {
    console.error('Get protocol workflow error:', error);
    return res.status(500).json({ error: 'Failed to get protocol workflow' });
  }
});

// Process call protocol
router.post('/process', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { call_id, answers } = req.body;
    
    if (!call_id || !answers) {
      return res.status(400).json({ error: 'Call ID and answers are required' });
    }
    
    const result = await protocolService.processCallProtocol(call_id, answers);
    return res.json(result);
  } catch (error) {
    console.error('Process protocol error:', error);
    return res.status(500).json({ error: 'Failed to process protocol' });
  }
});

// Get protocol statistics
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { call_type_id, start_date, end_date } = req.query;
    
    const dateRange = start_date && end_date ? {
      start: new Date(start_date as string),
      end: new Date(end_date as string)
    } : undefined;
    
    const stats = await protocolService.getProtocolStatistics(
      call_type_id as string,
      dateRange
    );
    
    return res.json(stats);
  } catch (error) {
    console.error('Get protocol statistics error:', error);
    return res.status(500).json({ error: 'Failed to get protocol statistics' });
  }
});

export default router; 
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import knex from '../../config/database';

const router = Router();

// Get all notifications for current user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await knex('notifications')
      .select('*')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    
    return res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread notifications
router.get('/unread', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const unreadNotifications = await knex('notifications')
      .select('*')
      .where({ 
        user_id: userId,
        read: false 
      })
      .orderBy('created_at', 'desc');
    
    return res.json(unreadNotifications);
  } catch (error) {
    console.error('Get unread notifications error:', error);
    return res.status(500).json({ error: 'Failed to get unread notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    await knex('notifications')
      .where({ id, user_id: userId })
      .update({ read: true, read_at: knex.fn.now() });
    
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await knex('notifications')
      .where({ user_id: userId, read: false })
      .update({ read: true, read_at: knex.fn.now() });
    
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    await knex('notifications')
      .where({ id, user_id: userId })
      .del();
    
    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (internal use)
export const createNotification = async (userId: number, type: string, title: string, message: string, data?: any) => {
  try {
    await knex('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      read: false
    });
    // Example usage for future POST/PATCH/DELETE endpoints:
    // emitDataUpdate('notifications', updatedData);
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

export default router; 
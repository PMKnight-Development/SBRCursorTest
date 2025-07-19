import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import knex from '../../config/database';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const users = await knex('users')
      .select('id', 'username', 'email', 'role', 'created_at')
      .orderBy('username');
    
    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await knex('users')
      .select('id', 'username', 'email', 'role', 'created_at')
      .where({ id })
      .first();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.patch('/:id', authenticateToken, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const currentUser = (req as any).user;
    
    // Only allow users to update their own profile, or admins to update anyone
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const updateData: any = {};
    if (email) updateData.email = email;
    if (role && currentUser.role === 'admin') updateData.role = role;
    
    await knex('users')
      .where({ id })
      .update({
        ...updateData,
        updated_at: knex.fn.now()
      });
    
    const updatedUser = await knex('users')
      .select('id', 'username', 'email', 'role', 'created_at')
      .where({ id })
      .first();
    
    return res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the last admin user
    const adminCount = await knex('users').where({ role: 'admin' }).count('* as count').first();
    const userToDelete = await knex('users').where({ id }).first();
    
    if (adminCount && adminCount['count'] === 1 && userToDelete?.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
    
    await knex('users').where({ id }).del();
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 
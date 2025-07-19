import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import knex from '../../config/database';

const router = Router();

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const [
      totalCalls,
      activeCalls,
      pendingCalls,
      totalUnits,
      availableUnits,
      dispatchedUnits
    ] = await Promise.all([
      knex('calls').count('* as count').first(),
      knex('calls').whereIn('status', ['dispatched', 'en-route', 'on-scene']).count('* as count').first(),
      knex('calls').where('status', 'pending').count('* as count').first(),
      knex('units').count('* as count').first(),
      knex('units').where('status', 'available').count('* as count').first(),
      knex('units').where('status', 'dispatched').count('* as count').first(),
    ]);

    const stats = {
      total_calls: parseInt(totalCalls?.['count'] as string) || 0,
      active_calls: parseInt(activeCalls?.['count'] as string) || 0,
      pending_calls: parseInt(pendingCalls?.['count'] as string) || 0,
      total_units: parseInt(totalUnits?.['count'] as string) || 0,
      available_units: parseInt(availableUnits?.['count'] as string) || 0,
      dispatched_units: parseInt(dispatchedUnits?.['count'] as string) || 0,
    };

    return res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get all call types
router.get('/call-types', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const callTypes = await knex('call_types').select('*').orderBy('name');
    return res.json(callTypes);
  } catch (error) {
    console.error('Get call types error:', error);
    return res.status(500).json({ error: 'Failed to get call types' });
  }
});

// Create call type
router.post('/call-types', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, priority, color } = req.body;
    
    if (!name || !priority) {
      return res.status(400).json({ error: 'Name and priority are required' });
    }
    
    const [callType] = await knex('call_types')
      .insert({
        name,
        description: description || '',
        priority,
        color: color || '#1976d2'
      })
      .returning('*');
    
    return res.status(201).json(callType);
  } catch (error) {
    console.error('Create call type error:', error);
    return res.status(500).json({ error: 'Failed to create call type' });
  }
});

// Update call type
router.patch('/call-types/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, priority, color } = req.body;
    
    const [callType] = await knex('call_types')
      .where({ id })
      .update({
        name,
        description: description || '',
        priority,
        color: color || '#1976d2'
      })
      .returning('*');
    
    if (!callType) {
      return res.status(404).json({ error: 'Call type not found' });
    }
    
    return res.json(callType);
  } catch (error) {
    console.error('Update call type error:', error);
    return res.status(500).json({ error: 'Failed to update call type' });
  }
});

// Get all unit groups
router.get('/unit-groups', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const unitGroups = await knex('unit_groups').select('*').orderBy('group_name');
    return res.json(unitGroups);
  } catch (error) {
    console.error('Get unit groups error:', error);
    return res.status(500).json({ error: 'Failed to get unit groups' });
  }
});

// Create unit group
router.post('/unit-groups', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { group_name, description, group_type, color } = req.body;
    
    if (!group_name || !group_type) {
      return res.status(400).json({ error: 'Group name and type are required' });
    }
    
    const [unitGroup] = await knex('unit_groups')
      .insert({
        group_name,
        description: description || '',
        group_type,
        color: color || '#1976d2'
      })
      .returning('*');
    
    return res.status(201).json(unitGroup);
  } catch (error) {
    console.error('Create unit group error:', error);
    return res.status(500).json({ error: 'Failed to create unit group' });
  }
});

// Update unit group
router.patch('/unit-groups/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { group_name, description, group_type, color } = req.body;
    
    const [unitGroup] = await knex('unit_groups')
      .where({ id })
      .update({
        group_name,
        description: description || '',
        group_type,
        color: color || '#1976d2'
      })
      .returning('*');
    
    if (!unitGroup) {
      return res.status(404).json({ error: 'Unit group not found' });
    }
    
    return res.json(unitGroup);
  } catch (error) {
    console.error('Update unit group error:', error);
    return res.status(500).json({ error: 'Failed to update unit group' });
  }
});

// Get all map layers
router.get('/map-layers', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const mapLayers = await knex('map_layers')
      .select('*')
      .orderBy('order', 'asc')
      .orderBy('name', 'asc');
    return res.json(mapLayers);
  } catch (error) {
    console.error('Get map layers error:', error);
    return res.status(500).json({ error: 'Failed to get map layers' });
  }
});

// Create map layer
router.post('/map-layers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, type, url, layer_id, opacity, visible, description } = req.body;
    
    if (!name || !type || !url) {
      return res.status(400).json({ error: 'Name, type, and URL are required' });
    }
    
    // Get the next order number
    const maxOrder = await knex('map_layers').max('order as max_order').first();
    const nextOrder = (maxOrder?.['max_order'] || 0) + 1;
    
    const [mapLayer] = await knex('map_layers')
      .insert({
        name,
        type,
        url,
        layer_id: layer_id || null,
        opacity: opacity || 0.8,
        visible: visible !== undefined ? visible : true,
        description: description || '',
        order: nextOrder
      })
      .returning('*');
    
    return res.status(201).json(mapLayer);
  } catch (error) {
    console.error('Create map layer error:', error);
    return res.status(500).json({ error: 'Failed to create map layer' });
  }
});

// Update map layer
router.patch('/map-layers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, url, layer_id, opacity, visible, description } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (layer_id !== undefined) updateData.layer_id = layer_id;
    if (opacity !== undefined) updateData.opacity = opacity;
    if (visible !== undefined) updateData.visible = visible;
    if (description !== undefined) updateData.description = description;
    
    const [mapLayer] = await knex('map_layers')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    if (!mapLayer) {
      return res.status(404).json({ error: 'Map layer not found' });
    }
    
    return res.json(mapLayer);
  } catch (error) {
    console.error('Update map layer error:', error);
    return res.status(500).json({ error: 'Failed to update map layer' });
  }
});

// Delete map layer
router.delete('/map-layers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await knex('map_layers')
      .where({ id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Map layer not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete map layer error:', error);
    return res.status(500).json({ error: 'Failed to delete map layer' });
  }
});

// Reorder map layers
router.patch('/map-layers/reorder', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { layers } = req.body;
    
    if (!Array.isArray(layers)) {
      return res.status(400).json({ error: 'Layers array is required' });
    }
    
    // Update each layer's order
    for (const layer of layers) {
      await knex('map_layers')
        .where({ id: layer.id })
        .update({ order: layer.order });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Reorder map layers error:', error);
    return res.status(500).json({ error: 'Failed to reorder map layers' });
  }
});

// Get all users
router.get('/users', authenticateToken, async (_req: Request, res: Response) => {
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

// Create user
router.post('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await knex('users')
      .where({ username })
      .orWhere({ email })
      .first();
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password (you should use bcrypt in production)
    const hashedPassword = password; // Replace with bcrypt.hash(password, 10)
    
    const [user] = await knex('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        role: role || 'dispatcher'
      })
      .returning(['id', 'username', 'email', 'role', 'created_at']);
    
    return res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get system statistics
router.get('/stats', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const totalCalls = await knex('calls').count('* as count').first();
    const activeCalls = await knex('calls').whereIn('status', ['pending', 'dispatched', 'en-route', 'on-scene']).count('* as count').first();
    const totalUnits = await knex('units').count('* as count').first();
    const availableUnits = await knex('units').where({ status: 'available' }).count('* as count').first();
    const totalUsers = await knex('users').count('* as count').first();
    
    const stats = {
      totalCalls: totalCalls?.['count'] || 0,
      activeCalls: activeCalls?.['count'] || 0,
      totalUnits: totalUnits?.['count'] || 0,
      availableUnits: availableUnits?.['count'] || 0,
      totalUsers: totalUsers?.['count'] || 0
    };
    
    return res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Failed to get system statistics' });
  }
});

// Get system logs
router.get('/logs', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const logs = await knex('system_logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    return res.json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({ error: 'Failed to get system logs' });
  }
});

// Get all points of interest
router.get('/pois', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const pois = await knex('points_of_interest')
      .select('*')
      .where({ is_active: true })
      .orderBy('name');
    return res.json(pois);
  } catch (error) {
    console.error('Get POIs error:', error);
    return res.status(500).json({ error: 'Failed to get points of interest' });
  }
});

// Search points of interest
router.get('/pois/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const pois = await knex('points_of_interest')
      .select('*')
      .where({ is_active: true })
      .andWhere(function() {
        this.where('name', 'ilike', `%${q}%`)
          .orWhere('description', 'ilike', `%${q}%`)
          .orWhere('type', 'ilike', `%${q}%`);
      })
      .orderBy('name')
      .limit(20);
    
    return res.json(pois);
  } catch (error) {
    console.error('Search POIs error:', error);
    return res.status(500).json({ error: 'Failed to search points of interest' });
  }
});

// Create point of interest
router.post('/pois', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, type, latitude, longitude, description } = req.body;
    
    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, type, latitude, and longitude are required' });
    }
    
    const [poi] = await knex('points_of_interest')
      .insert({
        name,
        type,
        latitude,
        longitude,
        description: description || '',
        is_active: true
      })
      .returning('*');
    
    return res.status(201).json(poi);
  } catch (error) {
    console.error('Create POI error:', error);
    return res.status(500).json({ error: 'Failed to create point of interest' });
  }
});

// Update point of interest
router.patch('/pois/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, latitude, longitude, description, is_active } = req.body;
    
    const [poi] = await knex('points_of_interest')
      .where({ id })
      .update({
        name,
        type,
        latitude,
        longitude,
        description: description || '',
        is_active: is_active !== undefined ? is_active : true
      })
      .returning('*');
    
    if (!poi) {
      return res.status(404).json({ error: 'Point of interest not found' });
    }
    
    return res.json(poi);
  } catch (error) {
    console.error('Update POI error:', error);
    return res.status(500).json({ error: 'Failed to update point of interest' });
  }
});

// Delete point of interest
router.delete('/pois/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await knex('points_of_interest')
      .where({ id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Point of interest not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete POI error:', error);
    return res.status(500).json({ error: 'Failed to delete point of interest' });
  }
});

export default router; 
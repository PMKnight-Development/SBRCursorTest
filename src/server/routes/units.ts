import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import knex from '../../config/database';
import { emitDataUpdate } from '../websocket';

const router = Router();

function createHttpError(message: string, status: number) {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

// Get all units
router.get('/', authenticateToken, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const units = await knex('units')
      .select(
        'units.*',
        'unit_groups.group_name'
      )
      .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
      .orderBy('units.unit_number');
    
    emitDataUpdate('units', units);
    return res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    return next(createHttpError('Failed to get units', 500));
  }
});

// Create new unit
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      unit_number,
      unit_name,
      unit_type,
      group_id,
      status
    } = req.body;
    
    if (!unit_number || !unit_name || !unit_type || !group_id) {
      return next(createHttpError('Missing required fields', 400));
    }
    
    // Check if unit number already exists
    const existingUnit = await knex('units').where({ unit_number }).first();
    if (existingUnit) {
      return next(createHttpError('Unit number already exists', 400));
    }
    
    const [unit] = await knex('units')
      .insert({
        unit_number,
        unit_name,
        unit_type,
        group_id,
        status: status || 'available',
        is_active: true
      })
      .returning('*');
    
    emitDataUpdate('units', [unit]);
    return res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    return next(createHttpError('Failed to create unit', 500));
  }
});

// Update unit
router.patch('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      unit_number,
      unit_name,
      unit_type,
      group_id,
      status
    } = req.body;
    
    // Check if unit number already exists (excluding current unit)
    if (unit_number) {
      const existingUnit = await knex('units')
        .where({ unit_number })
        .whereNot({ id })
        .first();
      if (existingUnit) {
        return next(createHttpError('Unit number already exists', 400));
      }
    }
    
    const [unit] = await knex('units')
      .where({ id })
      .update({
        unit_number,
        unit_name,
        unit_type,
        group_id,
        status
      })
      .returning('*');
    
    if (!unit) {
      return next(createHttpError('Unit not found', 404));
    }
    
    emitDataUpdate('units', [unit]);
    return res.json(unit);
  } catch (error) {
    console.error('Update unit error:', error);
    return next(createHttpError('Failed to update unit', 500));
  }
});

// Get unit by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const unit = await knex('units')
      .select(
        'units.*',
        'unit_groups.group_name'
      )
      .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
      .where('units.id', id)
      .first();
    
    if (!unit) {
      return next(createHttpError('Unit not found', 404));
    }
    
    return res.json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    return next(createHttpError('Failed to get unit', 500));
  }
});

// Update unit status
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return next(createHttpError('Status is required', 400));
    }
    
    const [unit] = await knex('units')
      .where({ id })
      .update({ status })
      .returning('*');
    
    if (!unit) {
      return next(createHttpError('Unit not found', 404));
    }
    
    emitDataUpdate('units', [unit]);
    return res.json(unit);
  } catch (error) {
    console.error('Update unit status error:', error);
    return next(createHttpError('Failed to update unit status', 500));
  }
});

// Update unit location
router.patch('/:id/location', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy } = req.body;
    
    if (!latitude || !longitude) {
      return next(createHttpError('Latitude and longitude are required', 400));
    }
    
    const [unit] = await knex('units')
      .where({ id })
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        current_accuracy: accuracy || null,
        last_location_update: knex.fn.now()
      })
      .returning('*');
    
    if (!unit) {
      return next(createHttpError('Unit not found', 404));
    }
    
    emitDataUpdate('units', [unit]);
    return res.json(unit);
  } catch (error) {
    console.error('Update unit location error:', error);
    return next(createHttpError('Failed to update unit location', 500));
  }
});

// Get available units
router.get('/available', authenticateToken, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const availableUnits = await knex('units')
      .select(
        'units.*',
        'unit_groups.group_name'
      )
      .leftJoin('unit_groups', 'units.group_id', 'unit_groups.id')
      .where({ status: 'available', is_active: true })
      .orderBy('units.unit_number');
    
    emitDataUpdate('units', availableUnits);
    return res.json(availableUnits);
  } catch (error) {
    console.error('Get available units error:', error);
    return next(createHttpError('Failed to get available units', 500));
  }
});

export default router; 
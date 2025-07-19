import { Request, Response, NextFunction } from 'express';

export const validateCall = (req: Request, res: Response, next: NextFunction) => {
  const { callType, location, description, priority } = req.body;
  
  if (!callType || !location || !description) {
    return res.status(400).json({ error: 'Call type, location, and description are required' });
  }
  
  if (priority && !['low', 'medium', 'high', 'emergency'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }
  
  return next();
};

export const validateUnit = (req: Request, res: Response, next: NextFunction) => {
  const { unitNumber, unitType, status } = req.body;
  
  if (!unitNumber || !unitType) {
    return res.status(400).json({ error: 'Unit number and type are required' });
  }
  
  if (status && !['available', 'busy', 'out-of-service'].includes(status)) {
    return res.status(400).json({ error: 'Invalid unit status' });
  }
  
  return next();
};

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { username, email, role } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }
  
  if (role && !['admin', 'dispatcher', 'supervisor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }
  
  return next();
}; 
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

// In-memory token blacklist (for production, use Redis or persistent store)
const tokenBlacklist = new Set<string>();

export const addToTokenBlacklist = (token: string) => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string) => {
  return tokenBlacklist.has(token);
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
  }

  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    // Fail fast if secret is not set
    throw new Error('JWT_SECRET environment variable must be set');
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
}; 
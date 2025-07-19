import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, addToTokenBlacklist } from '../middleware/auth';
import { validateUser } from '../middleware/validation';
import knex from '../../config/database';

const router = Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      const err = new Error('Username and password are required');
      (err as any).status = 400;
      return next(err);
    }
    const user = await knex('users').where({ username }).first();
    if (!user) {
      const err = new Error('Invalid credentials');
      (err as any).status = 401;
      return next(err);
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      const err = new Error('Invalid credentials');
      (err as any).status = 401;
      return next(err);
    }
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: '24h' }
    );
    // TODO: Issue refresh token here and return to client (not implemented)
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      const err = new Error('User not found');
      (err as any).status = 404;
      return next(err);
    }
    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    });
  } catch (error) {
    return next(error);
  }
});

// Logout endpoint (server-side token blacklist)
router.post('/logout', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      addToTokenBlacklist(token);
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
});

// Register new user (admin only)
router.post('/register', authenticateToken, validateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, role } = req.body;
    // Check if user already exists
    const existingUser = await knex('users').where({ username }).orWhere({ email }).first();
    if (existingUser) {
      const err = new Error('Username or email already exists');
      (err as any).status = 400;
      return next(err);
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const [userId] = await knex('users').insert({
      username,
      email,
      password_hash: hashedPassword,
      role: role || 'dispatcher'
    }).returning('id');
    return res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    return next(error);
  }
});

export default router; 
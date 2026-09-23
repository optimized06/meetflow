import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!supabase) {
    // Mock mode, allow all
    const mockUserId = req.headers['x-mock-user-id'] as string;
    req.user = { id: mockUserId || 'mock-user-id', email: 'mock@example.com' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

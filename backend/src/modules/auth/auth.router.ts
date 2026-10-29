import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../../models/User';
import { signToken } from '../../utils/jwt';
import { authenticate } from '../../middleware/auth';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email or password format.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const { email, password } = parseResult.data;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.status !== 'active') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password_hash');
    if (!user) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User account not found.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});


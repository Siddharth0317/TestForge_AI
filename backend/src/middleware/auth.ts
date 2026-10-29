import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { Project } from '../models/Project';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed.',
        request_id: req.id,
        details: [],
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token.',
        request_id: req.id,
        details: [],
        timestamp: new Date().toISOString()
      }
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient platform role to access this resource.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    next();
  };
}

export function requireProjectRole(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const projectId = req.params.projectId || req.body.project_id;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid project ID is required.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Platform admin has universal project access
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Check if user is owner
    if (project.owner_id.toString() === req.user.userId) {
      next();
      return;
    }

    // Check project membership role
    const member = project.members.find(
      (m) => m.user_id.toString() === req.user?.userId
    );

    if (!member || !allowedRoles.includes(member.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access or modify this project.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    next();
  };
}


import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Project } from '../../models/Project';
import { Requirement } from '../../models/Requirement';
import { TargetEnvironment } from '../../models/TargetEnvironment';
import { authenticate, requireProjectRole } from '../../middleware/auth';

export const projectsRouter = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(120),
  description: z.string().max(1000).default(''),
  settings: z.object({
    default_priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    require_approval_for_execution: z.boolean().default(true)
  }).default({ default_priority: 'medium', require_approval_for_execution: true })
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  settings: z.object({
    default_priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    require_approval_for_execution: z.boolean().optional()
  }).optional()
});

projectsRouter.use(authenticate);

projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project validation failed.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const { name, description, settings } = parseResult.data;
    const project = await Project.create({
      name,
      description,
      owner_id: new mongoose.Types.ObjectId(req.user!.userId),
      members: [
        {
          user_id: new mongoose.Types.ObjectId(req.user!.userId),
          role: req.user!.role === 'admin' ? 'admin' : 'qa_engineer'
        }
      ],
      settings
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const filter = req.user!.role === 'admin'
      ? {}
      : {
          $or: [
            { owner_id: userId },
            { 'members.user_id': userId }
          ]
        };

    const projects = await Project.find(filter).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/:projectId', requireProjectRole(['admin', 'qa_engineer', 'viewer']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.projectId);
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

    const [requirementCount, environmentCount] = await Promise.all([
      Requirement.countDocuments({ project_id: project._id }),
      TargetEnvironment.countDocuments({ project_id: project._id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        summary: {
          requirements_count: requirementCount,
          environments_count: environmentCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.patch('/:projectId', requireProjectRole(['admin']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project update validation failed.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $set: parseResult.data },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});


import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { TargetEnvironment } from '../../models/TargetEnvironment';
import { authenticate, requireProjectRole } from '../../middleware/auth';

export const environmentsRouter = Router();

const createEnvironmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required').trim(),
  base_url: z.string().url('A valid base URL is required'),
  allowed_hosts: z.array(z.string().min(1)).min(1, 'At least one allowed host is required'),
  environment_type: z.enum(['local', 'dev', 'staging', 'production_authorized']).default('staging'),
  is_active: z.boolean().default(true),
  timeouts: z.object({
    page_load_seconds: z.number().min(1).max(120).default(30),
    implicit_wait_seconds: z.number().min(0).max(30).default(5)
  }).default({ page_load_seconds: 30, implicit_wait_seconds: 5 }),
  locators: z.array(
    z.object({
      key: z.string().min(1).trim(),
      page: z.string().min(1).trim(),
      strategy: z.enum(['id', 'css', 'xpath', 'name', 'test_id']),
      value: z.string().min(1).trim(),
      description: z.string().optional()
    })
  ).default([])
});

environmentsRouter.use(authenticate);

// Create environment for a project
environmentsRouter.post('/projects/:projectId/environments', requireProjectRole(['admin']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createEnvironmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Environment validation failed.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const projectId = new mongoose.Types.ObjectId(req.params.projectId);
    const existing = await TargetEnvironment.findOne({ project_id: projectId, name: parseResult.data.name });
    if (existing) {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `An environment named '${parseResult.data.name}' already exists in this project.`,
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const envRecord = await TargetEnvironment.create({
      project_id: projectId,
      ...parseResult.data
    });

    res.status(201).json({
      success: true,
      data: envRecord
    });
  } catch (error) {
    next(error);
  }
});

// List environments for a project
environmentsRouter.get('/projects/:projectId/environments', requireProjectRole(['admin', 'qa_engineer', 'viewer']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const environments = await TargetEnvironment.find({
      project_id: new mongoose.Types.ObjectId(req.params.projectId)
    }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: environments
    });
  } catch (error) {
    next(error);
  }
});


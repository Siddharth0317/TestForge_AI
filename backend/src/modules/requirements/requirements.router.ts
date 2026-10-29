import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Requirement } from '../../models/Requirement';
import { authenticate, requireProjectRole } from '../../middleware/auth';
import { AIServiceClient } from '../../services/aiService';

export const requirementsRouter = Router();

const createRequirementSchema = z.object({
  original_text: z.string().min(5, 'Requirement text must be at least 5 characters').max(4000),
  source_metadata: z.object({
    jira_key: z.string().optional(),
    author: z.string().optional(),
    document_ref: z.string().optional()
  }).optional()
});

const updateRequirementSchema = z.object({
  original_text: z.string().min(5).max(4000),
  source_metadata: z.object({
    jira_key: z.string().optional(),
    author: z.string().optional(),
    document_ref: z.string().optional()
  }).optional()
});

requirementsRouter.use(authenticate);

// Create requirement under a project
requirementsRouter.post('/projects/:projectId/requirements', requireProjectRole(['admin', 'qa_engineer']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createRequirementSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Requirement validation failed.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const { original_text, source_metadata } = parseResult.data;
    let normalized_text = original_text.trim().replace(/\s+/g, ' ');

    // Call AI microservice for deterministic NLP analysis
    const analysis = await AIServiceClient.analyzeRequirement(original_text, undefined, 1);
    const status = analysis ? 'analyzed' : 'draft';
    if (analysis?.normalized_text) {
      normalized_text = analysis.normalized_text;
    }

    const requirement = await Requirement.create({
      project_id: new mongoose.Types.ObjectId(req.params.projectId),
      version: 1,
      original_text,
      normalized_text,
      source_metadata,
      nlp_analysis: analysis || undefined,
      status,
      created_by: new mongoose.Types.ObjectId(req.user!.userId)
    });

    res.status(201).json({
      success: true,
      data: requirement
    });
  } catch (error) {
    next(error);
  }
});

// List requirements for a project
requirementsRouter.get('/projects/:projectId/requirements', requireProjectRole(['admin', 'qa_engineer', 'viewer']), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requirements = await Requirement.find({
      project_id: new mongoose.Types.ObjectId(req.params.projectId)
    }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: requirements
    });
  } catch (error) {
    next(error);
  }
});

// Retrieve requirement by ID
requirementsRouter.get('/requirements/:requirementId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requirementId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid requirement ID.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Requirement not found.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: requirement
    });
  } catch (error) {
    next(error);
  }
});

// Edit requirement (bumps version counter, preserves lineage, and re-runs NLP analysis)
requirementsRouter.patch('/requirements/:requirementId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requirementId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid requirement ID.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const parseResult = updateRequirementSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Requirement update validation failed.',
          request_id: req.id,
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const currentReq = await Requirement.findById(requirementId);
    if (!currentReq) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Requirement not found.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const { original_text, source_metadata } = parseResult.data;
    let normalized_text = original_text.trim().replace(/\s+/g, ' ');
    const nextVersion = currentReq.version + 1;

    // Trigger re-analysis for new version
    const analysis = await AIServiceClient.analyzeRequirement(original_text, currentReq._id.toString(), nextVersion);
    if (analysis?.normalized_text) {
      normalized_text = analysis.normalized_text;
    }

    currentReq.original_text = original_text;
    currentReq.normalized_text = normalized_text;
    if (source_metadata) {
      currentReq.source_metadata = source_metadata;
    }
    currentReq.version = nextVersion;
    currentReq.nlp_analysis = analysis || currentReq.nlp_analysis;
    currentReq.status = analysis ? 'analyzed' : 'draft';

    await currentReq.save();

    res.status(200).json({
      success: true,
      data: currentReq
    });
  } catch (error) {
    next(error);
  }
});

// Explicit trigger endpoint to analyze or re-analyze a requirement
requirementsRouter.post('/requirements/:requirementId/analyze', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requirementId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid requirement ID.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Requirement not found.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const analysis = await AIServiceClient.analyzeRequirement(
      requirement.original_text,
      requirement._id.toString(),
      requirement.version
    );

    if (!analysis) {
      res.status(502).json({
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'Failed to complete requirement analysis with AI service.',
          request_id: req.id,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    requirement.normalized_text = analysis.normalized_text;
    requirement.nlp_analysis = analysis;
    requirement.status = 'analyzed';
    await requirement.save();

    res.status(200).json({
      success: true,
      data: requirement
    });
  } catch (error) {
    next(error);
  }
});

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireProjectRole } from '../../middleware/auth';
import { Project } from '../../models/Project';
import { Requirement } from '../../models/Requirement';
import { GenerationJob } from '../../models/GenerationJob';
import { AIServiceClient } from '../../services/aiService';
import { logger } from '../../utils/logger';

export const generationRouter = Router();

// POST /api/v1/projects/:projectId/requirements/:requirementId/generate
generationRouter.post(
  '/projects/:projectId/requirements/:requirementId/generate',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, requirementId } = req.params;
    const { scenario_types, provider_override, max_cases } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(requirementId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID or requirement ID'
        }
      });
      return;
    }

    try {
      const requirement = await Requirement.findOne({
        _id: requirementId,
        project_id: projectId
      });

      if (!requirement) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Requirement not found in project'
          }
        });
        return;
      }

      // Create an initial generation job record
      const job = new GenerationJob({
        project_id: projectId,
        requirement_id: requirement._id,
        requirement_version: requirement.version,
        requesting_user: new mongoose.Types.ObjectId(req.user!.userId),
        status: 'processing',
        provider: provider_override || 'mock',
        model_name: 'pending',
        prompt_template_version: '1.0.0',
        schema_version: '1.0',
        candidates: []
      });
      await job.save();

      // Call AI Service
      const aiResponse = await AIServiceClient.generateTestCases({
        requirement_id: requirement._id.toString(),
        requirement_version: requirement.version,
        requirement_text: requirement.normalized_text || requirement.original_text,
        nlp_analysis: requirement.nlp_analysis,
        ml_category: requirement.ml_classification?.category,
        scenario_types: scenario_types,
        provider_override: provider_override,
        max_cases: max_cases || 4
      });

      if (!aiResponse) {
        job.status = 'failed';
        job.error_code = 'AI_SERVICE_UNAVAILABLE';
        job.error_summary = 'AI microservice is unavailable or request timed out';
        await job.save();

        res.status(502).json({
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI microservice failed to generate candidate test cases'
          },
          job
        });
        return;
      }

      // Update job with generation response
      job.status = aiResponse.status === 'completed' ? 'completed' : 'failed';
      job.provider = aiResponse.provider;
      job.model_name = aiResponse.model;
      job.prompt_template_version = aiResponse.prompt_template_version;
      job.duration_ms = aiResponse.duration_ms;
      job.token_usage = aiResponse.token_usage;
      job.candidates = aiResponse.candidates;
      job.error_code = aiResponse.error_code;
      job.error_summary = aiResponse.error_summary;
      await job.save();

      logger.info(
        { jobId: job._id, candidatesCount: job.candidates.length, status: job.status },
        'Test case generation completed'
      );

      res.status(200).json({ job });
    } catch (error: any) {
      logger.error({ err: error.message }, 'Failed to run test case generation job');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during test case generation'
        }
      });
    }
  }
);

// GET /api/v1/projects/:projectId/requirements/:requirementId/generation-jobs
generationRouter.get(
  '/projects/:projectId/requirements/:requirementId/generation-jobs',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, requirementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(requirementId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID or requirement ID'
        }
      });
      return;
    }

    try {
      const jobs = await GenerationJob.find({
        project_id: projectId,
        requirement_id: requirementId
      })
        .sort({ created_at: -1 })
        .limit(20);

      res.status(200).json({ jobs });
    } catch (error: any) {
      logger.error({ err: error.message }, 'Failed to fetch generation jobs');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve generation jobs'
        }
      });
    }
  }
);

// GET /api/v1/projects/:projectId/generation-jobs/:jobId
generationRouter.get(
  '/projects/:projectId/generation-jobs/:jobId',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID or job ID'
        }
      });
      return;
    }

    try {
      const job = await GenerationJob.findOne({
        _id: jobId,
        project_id: projectId
      });

      if (!job) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Generation job not found'
          }
        });
        return;
      }

      res.status(200).json({ job });
    } catch (error: any) {
      logger.error({ err: error.message }, 'Failed to fetch generation job');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve generation job'
        }
      });
    }
  }
);

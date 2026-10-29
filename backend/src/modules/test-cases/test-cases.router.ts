import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireProjectRole } from '../../middleware/auth';
import { testCasesService, ImportCandidateInput } from './test-cases.service';
import { TestCase } from '../../models/TestCase';
import { Project } from '../../models/Project';

export const testCasesRouter = Router();

// Helper to verify project role when only testCaseId is in params
async function checkTestCaseAccess(
  req: Request,
  res: Response,
  allowedRoles: Array<'admin' | 'qa_engineer' | 'viewer'>
): Promise<{ testCase: any; projectId: string } | null> {
  const { testCaseId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(testCaseId)) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid test case ID format', request_id: req.id }
    });
    return null;
  }

  const testCase = await TestCase.findById(testCaseId);
  if (!testCase) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Test case not found', request_id: req.id }
    });
    return null;
  }

  const projectId = testCase.project_id.toString();

  // Platform admin always has access
  if (req.user?.role === 'admin') {
    return { testCase, projectId };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Associated project not found', request_id: req.id }
    });
    return null;
  }

  const member = project.members.find((m) => m.user_id.toString() === req.user?.userId);
  if (!member || !allowedRoles.includes(member.role)) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient project permissions to access or modify this test case',
        request_id: req.id
      }
    });
    return null;
  }

  return { testCase, projectId };
}

// 1. POST /api/v1/projects/:projectId/requirements/:requirementId/candidates/import
testCasesRouter.post(
  '/projects/:projectId/requirements/:requirementId/candidates/import',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, requirementId } = req.params;
    const { candidates } = req.body || {};

    if (!Array.isArray(candidates) || candidates.length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include a non-empty array of candidate test cases',
          request_id: req.id
        }
      });
      return;
    }

    try {
      const imported = await testCasesService.importCandidates(
        projectId,
        requirementId,
        candidates as ImportCandidateInput[],
        { id: req.user!.userId, email: req.user!.email }
      );

      res.status(201).json({
        imported_count: imported.length,
        test_cases: imported,
        request_id: req.id
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'IMPORT_FAILED',
          message: err.message,
          request_id: req.id
        }
      });
    }
  }
);

// 2. GET /api/v1/projects/:projectId/requirements/:requirementId/test-cases
testCasesRouter.get(
  '/projects/:projectId/requirements/:requirementId/test-cases',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, requirementId } = req.params;
    const { review_status, scenario_type, priority, is_current } = req.query;

    try {
      const cases = await testCasesService.listTestCases(projectId, {
        requirement_id: requirementId,
        review_status: review_status as string,
        scenario_type: scenario_type as string,
        priority: priority as string,
        is_current: is_current !== undefined ? is_current === 'true' : true
      });

      res.status(200).json({
        test_cases: cases,
        count: cases.length,
        request_id: req.id
      });
    } catch (err: any) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message, request_id: req.id }
      });
    }
  }
);

// 3. GET /api/v1/projects/:projectId/test-cases (Project-wide Test Case Explorer)
testCasesRouter.get(
  '/projects/:projectId/test-cases',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { review_status, scenario_type, priority, is_current, requirement_id } = req.query;

    try {
      const cases = await testCasesService.listTestCases(projectId, {
        requirement_id: requirement_id as string,
        review_status: review_status as string,
        scenario_type: scenario_type as string,
        priority: priority as string,
        is_current: is_current !== undefined ? is_current === 'true' : true
      });

      res.status(200).json({
        test_cases: cases,
        count: cases.length,
        request_id: req.id
      });
    } catch (err: any) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message, request_id: req.id }
      });
    }
  }
);

// 4. GET /api/v1/test-cases/:testCaseId
testCasesRouter.get(
  '/test-cases/:testCaseId',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const access = await checkTestCaseAccess(req, res, ['admin', 'qa_engineer', 'viewer']);
    if (!access) return;

    res.status(200).json({
      test_case: access.testCase,
      request_id: req.id
    });
  }
);

// 5. PATCH /api/v1/test-cases/:testCaseId (Edit case)
testCasesRouter.patch(
  '/test-cases/:testCaseId',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const access = await checkTestCaseAccess(req, res, ['admin', 'qa_engineer']);
    if (!access) return;

    try {
      const updated = await testCasesService.editTestCase(
        req.params.testCaseId,
        req.body,
        { id: req.user!.userId, email: req.user!.email }
      );

      res.status(200).json({
        test_case: updated,
        version_bumped: updated.version > access.testCase.version,
        request_id: req.id
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'EDIT_FAILED',
          message: err.message,
          request_id: req.id
        }
      });
    }
  }
);

// 6. POST /api/v1/test-cases/:testCaseId/approve
testCasesRouter.post(
  '/test-cases/:testCaseId/approve',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const access = await checkTestCaseAccess(req, res, ['admin', 'qa_engineer']);
    if (!access) return;

    const { notes } = req.body || {};

    try {
      const approved = await testCasesService.approveTestCase(
        req.params.testCaseId,
        notes,
        { id: req.user!.userId, email: req.user!.email }
      );

      res.status(200).json({
        test_case: approved,
        status: 'approved',
        request_id: req.id
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'APPROVAL_FAILED',
          message: err.message,
          request_id: req.id
        }
      });
    }
  }
);

// 7. POST /api/v1/test-cases/:testCaseId/reject
testCasesRouter.post(
  '/test-cases/:testCaseId/reject',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const access = await checkTestCaseAccess(req, res, ['admin', 'qa_engineer']);
    if (!access) return;

    const { reason } = req.body || {};
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A rejection reason is required',
          request_id: req.id
        }
      });
      return;
    }

    try {
      const rejected = await testCasesService.rejectTestCase(
        req.params.testCaseId,
        reason,
        { id: req.user!.userId, email: req.user!.email }
      );

      res.status(200).json({
        test_case: rejected,
        status: 'rejected',
        request_id: req.id
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'REJECTION_FAILED',
          message: err.message,
          request_id: req.id
        }
      });
    }
  }
);

// 8. POST /api/v1/test-cases/:testCaseId/request-changes
testCasesRouter.post(
  '/test-cases/:testCaseId/request-changes',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const access = await checkTestCaseAccess(req, res, ['admin', 'qa_engineer']);
    if (!access) return;

    const { notes } = req.body || {};
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Feedback notes are required when requesting changes',
          request_id: req.id
        }
      });
      return;
    }

    try {
      const updated = await testCasesService.requestChangesTestCase(
        req.params.testCaseId,
        notes,
        { id: req.user!.userId, email: req.user!.email }
      );

      res.status(200).json({
        test_case: updated,
        status: 'needs_changes',
        request_id: req.id
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'REQUEST_CHANGES_FAILED',
          message: err.message,
          request_id: req.id
        }
      });
    }
  }
);

// 9. GET /api/v1/projects/:projectId/audit-events
testCasesRouter.get(
  '/projects/:projectId/audit-events',
  authenticate,
  requireProjectRole(['admin', 'qa_engineer', 'viewer']),
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { entity_id } = req.query;

    try {
      const events = await testCasesService.listAuditEvents(
        projectId,
        entity_id as string | undefined
      );

      res.status(200).json({
        audit_events: events,
        count: events.length,
        request_id: req.id
      });
    } catch (err: any) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message, request_id: req.id }
      });
    }
  }
);

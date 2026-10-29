import mongoose, { Types } from 'mongoose';
import { TestCase, ITestCase, IValidationFinding } from '../../models/TestCase';
import { Requirement } from '../../models/Requirement';
import { AuditEvent } from '../../models/AuditEvent';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface ImportCandidateInput {
  title: string;
  category?: string;
  scenario_type: 'positive' | 'negative' | 'boundary' | 'authorization' | 'error_handling' | 'state_transition';
  preconditions?: string[];
  test_data?: Record<string, any>;
  steps: Array<{
    step_number: number;
    action: any;
    target_ref: string;
    value_ref?: string | null;
  }>;
  expected_result: string;
  assertions?: Array<{
    type: any;
    target_ref: string;
    expected_value?: string | null;
    timeout_ms?: number;
  }>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assumptions?: string[];
  source_evidence?: Array<{ requirement_span: string }>;
}

export class TestCasesService {
  /**
   * Calls AI Service to perform deterministic validation and explainable rule-based scoring.
   */
  async validateCandidates(
    requirementText: string,
    candidates: ImportCandidateInput[]
  ): Promise<Array<{
    is_valid: boolean;
    findings: IValidationFinding[];
    priority_score: number;
    priority_rationale: string;
    automation_status: string;
  }>> {
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/internal/v1/test-cases/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': env.INTERNAL_SERVICE_KEY
        },
        body: JSON.stringify({
          requirement_text: requirementText,
          candidate_test_cases: candidates
        })
      });

      if (response.ok) {
        const data = await response.json() as { validation_results: any[] };
        return data.validation_results;
      }

      logger.warn({ status: response.status }, 'AI Service validation returned non-200; using local fallback');
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to connect to AI Service for validation; using local fallback');
    }

    // Local deterministic fallback
    return candidates.map((c) => {
      const findings: IValidationFinding[] = [];
      if (!c.title || c.title.trim().length < 3) {
        findings.push({ rule: 'schema_missing_title', severity: 'error', message: 'Title is required (min 3 chars)' });
      }
      if (!c.steps || c.steps.length === 0) {
        findings.push({ rule: 'schema_empty_steps', severity: 'error', message: 'At least one step is required' });
      }
      if (!c.expected_result || c.expected_result.trim().length < 3) {
        findings.push({ rule: 'schema_missing_expected_result', severity: 'error', message: 'Expected result is required' });
      }
      const hasStepAssertion = c.steps?.some((s) => s.action?.startsWith('assert_'));
      const hasExplicitAssertion = (c.assertions && c.assertions.length > 0);
      if (!hasStepAssertion && !hasExplicitAssertion) {
        findings.push({ rule: 'schema_missing_assertions', severity: 'error', message: 'At least one assertion is required' });
      }
      if (c.assumptions && c.assumptions.length > 0) {
        findings.push({
          rule: 'unstated_assumptions',
          severity: 'info',
          message: `Relies on ${c.assumptions.length} unstated assumption(s)`
        });
      }

      const isValid = !findings.some((f) => f.severity === 'error');
      return {
        is_valid: isValid,
        findings,
        priority_score: isValid ? 60 : 30,
        priority_rationale: 'Local rule fallback scoring',
        automation_status: isValid ? 'requires_configuration' : 'not_executable'
      };
    });
  }

  /**
   * Deterministic duplicate detection against existing active test cases in the project.
   * Flags candidates instead of destructively deleting them.
   */
  detectDuplicate(
    candidate: ImportCandidateInput,
    existingCases: ITestCase[]
  ): { is_duplicate: boolean; duplicate_of_id?: Types.ObjectId; duplicate_reason?: string } {
    const normTitle = candidate.title.trim().toLowerCase();
    const candSequence = (candidate.steps || [])
      .map((s) => `${s.action}:${s.target_ref}`)
      .join('->');

    for (const existing of existingCases) {
      const existTitle = existing.title.trim().toLowerCase();
      if (existTitle === normTitle) {
        return {
          is_duplicate: true,
          duplicate_of_id: existing._id as Types.ObjectId,
          duplicate_reason: `Identical title matches existing test case '${existing.title}'`
        };
      }

      const existSequence = (existing.steps || [])
        .map((s) => `${s.action}:${s.target_ref}`)
        .join('->');

      if (candSequence && existSequence && candSequence === existSequence) {
        return {
          is_duplicate: true,
          duplicate_of_id: existing._id as Types.ObjectId,
          duplicate_reason: `Identical action/locator execution sequence to test case '${existing.title}'`
        };
      }
    }

    return { is_duplicate: false };
  }

  /**
   * Import candidate test cases for a requirement.
   */
  async importCandidates(
    projectId: string | Types.ObjectId,
    requirementId: string | Types.ObjectId,
    candidates: ImportCandidateInput[],
    actor: { id: string | Types.ObjectId; email: string }
  ): Promise<ITestCase[]> {
    const requirement = await Requirement.findOne({ _id: requirementId, project_id: projectId });
    if (!requirement) {
      throw new Error('Requirement not found in this project');
    }

    const reqText = requirement.normalized_text || requirement.original_text;
    const validationResults = await this.validateCandidates(reqText, candidates);

    // Fetch existing active test cases for duplicate checking
    const existingCases = await TestCase.find({ project_id: projectId, is_current: true });

    const createdCases: ITestCase[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const val = validationResults[i] || {
        is_valid: true,
        findings: [],
        priority_score: 50,
        priority_rationale: '',
        automation_status: 'requires_configuration'
      };

      const dupCheck = this.detectDuplicate(cand, existingCases);

      // If candidate has assertions in steps, ensure explicit assertions array is populated
      const explicitAssertions = cand.assertions && cand.assertions.length > 0
        ? cand.assertions
        : cand.steps
            .filter((s) => s.action?.startsWith('assert_'))
            .map((s) => ({
              type: s.action as any,
              target_ref: s.target_ref,
              expected_value: s.value_ref || null,
              timeout_ms: 5000
            }));

      const newCase = new TestCase({
        project_id: new Types.ObjectId(projectId),
        requirement_id: new Types.ObjectId(requirementId),
        requirement_version: requirement.version,
        version: 1,
        is_current: true,
        title: cand.title,
        category: cand.category || 'business_logic',
        scenario_type: cand.scenario_type,
        preconditions: cand.preconditions || [],
        test_data: cand.test_data || {},
        steps: cand.steps || [],
        expected_result: cand.expected_result,
        assertions: explicitAssertions,
        priority: cand.priority || 'medium',
        priority_score: val.priority_score,
        priority_rationale: val.priority_rationale,
        automation_status: val.automation_status,
        validation_findings: val.findings,
        is_duplicate: dupCheck.is_duplicate,
        duplicate_of_id: dupCheck.duplicate_of_id,
        duplicate_reason: dupCheck.duplicate_reason,
        assumptions: cand.assumptions || [],
        source_evidence: cand.source_evidence || [],
        review_status: 'pending'
      });

      await newCase.save();
      createdCases.push(newCase);
      existingCases.push(newCase); // add to check subsequent candidates in batch
    }

    // Record audit event
    await AuditEvent.create({
      project_id: new Types.ObjectId(projectId),
      entity_type: 'test_case',
      entity_id: createdCases[0]?._id || new Types.ObjectId(requirementId),
      action: 'test_cases_imported',
      actor_id: new Types.ObjectId(actor.id),
      actor_email: actor.email,
      details: {
        requirement_id: requirementId,
        imported_count: createdCases.length,
        test_case_ids: createdCases.map((c) => c._id)
      },
      timestamp: new Date()
    });

    return createdCases;
  }

  /**
   * Edit a test case.
   * If already approved, editing increments the version and resets review_status to pending.
   */
  async editTestCase(
    testCaseId: string | Types.ObjectId,
    updateData: Partial<ImportCandidateInput> & { expected_version?: number },
    actor: { id: string | Types.ObjectId; email: string }
  ): Promise<ITestCase> {
    const existing = await TestCase.findById(testCaseId);
    if (!existing) {
      throw new Error('Test case not found');
    }

    if (updateData.expected_version && existing.version !== updateData.expected_version) {
      throw new Error(`Concurrency conflict: test case version is ${existing.version}, expected ${updateData.expected_version}`);
    }

    const requirement = await Requirement.findById(existing.requirement_id);
    const reqText = requirement ? (requirement.normalized_text || requirement.original_text) : '';

    // Prepare updated candidate structure
    const updatedCandidate: ImportCandidateInput = {
      title: updateData.title ?? existing.title,
      category: updateData.category ?? existing.category,
      scenario_type: updateData.scenario_type ?? existing.scenario_type,
      preconditions: updateData.preconditions ?? existing.preconditions,
      test_data: updateData.test_data ?? existing.test_data,
      steps: updateData.steps ?? existing.steps,
      expected_result: updateData.expected_result ?? existing.expected_result,
      assertions: updateData.assertions ?? existing.assertions,
      priority: updateData.priority ?? existing.priority,
      assumptions: updateData.assumptions ?? existing.assumptions,
      source_evidence: updateData.source_evidence ?? existing.source_evidence
    };

    const [val] = await this.validateCandidates(reqText, [updatedCandidate]);

    if (existing.review_status === 'approved') {
      // Versioning rule: create new version, preserve historical approved version
      existing.is_current = false;
      await existing.save();

      const newVersion = new TestCase({
        project_id: existing.project_id,
        requirement_id: existing.requirement_id,
        requirement_version: existing.requirement_version,
        version: existing.version + 1,
        is_current: true,
        title: updatedCandidate.title,
        category: updatedCandidate.category,
        scenario_type: updatedCandidate.scenario_type,
        preconditions: updatedCandidate.preconditions,
        test_data: updatedCandidate.test_data,
        steps: updatedCandidate.steps,
        expected_result: updatedCandidate.expected_result,
        assertions: updatedCandidate.assertions,
        priority: updatedCandidate.priority,
        priority_score: val.priority_score,
        priority_rationale: val.priority_rationale,
        automation_status: val.automation_status,
        validation_findings: val.findings,
        is_duplicate: existing.is_duplicate,
        duplicate_of_id: existing.duplicate_of_id,
        duplicate_reason: existing.duplicate_reason,
        assumptions: updatedCandidate.assumptions,
        source_evidence: updatedCandidate.source_evidence,
        review_status: 'pending',
        previous_version_id: existing._id
      });

      await newVersion.save();

      await AuditEvent.create({
        project_id: existing.project_id,
        entity_type: 'test_case',
        entity_id: newVersion._id,
        action: 'test_case_version_bumped',
        actor_id: new Types.ObjectId(actor.id),
        actor_email: actor.email,
        details: {
          previous_version: existing.version,
          new_version: newVersion.version,
          previous_test_case_id: existing._id,
          reason: 'Approved test case was edited, triggering revision bump'
        },
        timestamp: new Date()
      });

      return newVersion;
    } else {
      // Modify in place
      existing.title = updatedCandidate.title;
      existing.category = updatedCandidate.category || existing.category;
      existing.scenario_type = updatedCandidate.scenario_type;
      existing.preconditions = updatedCandidate.preconditions || [];
      existing.test_data = updatedCandidate.test_data || {};
      existing.steps = updatedCandidate.steps as any;
      existing.expected_result = updatedCandidate.expected_result;
      existing.assertions = updatedCandidate.assertions as any;
      existing.priority = updatedCandidate.priority || existing.priority;
      existing.assumptions = updatedCandidate.assumptions || [];
      existing.source_evidence = updatedCandidate.source_evidence || [];
      existing.validation_findings = val.findings;
      existing.priority_score = val.priority_score;
      existing.priority_rationale = val.priority_rationale;
      existing.automation_status = val.automation_status as any;
      existing.updated_at = new Date();

      await existing.save();

      await AuditEvent.create({
        project_id: existing.project_id,
        entity_type: 'test_case',
        entity_id: existing._id,
        action: 'test_case_edited',
        actor_id: new Types.ObjectId(actor.id),
        actor_email: actor.email,
        details: {
          version: existing.version,
          review_status: existing.review_status
        },
        timestamp: new Date()
      });

      return existing;
    }
  }

  /**
   * Approve a test case.
   * Gated: Cannot approve if there are blocking validation errors.
   */
  async approveTestCase(
    testCaseId: string | Types.ObjectId,
    notes: string | undefined,
    actor: { id: string | Types.ObjectId; email: string }
  ): Promise<ITestCase> {
    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    const blockingErrors = testCase.validation_findings.filter((f) => f.severity === 'error');
    if (blockingErrors.length > 0) {
      const errorMsgs = blockingErrors.map((e) => e.message).join('; ');
      throw new Error(`Cannot approve test case with blocking validation errors: ${errorMsgs}`);
    }

    testCase.review_status = 'approved';
    testCase.review_notes = notes || null;
    testCase.reviewed_by = new Types.ObjectId(actor.id);
    testCase.reviewed_at = new Date();
    await testCase.save();

    await AuditEvent.create({
      project_id: testCase.project_id,
      entity_type: 'test_case',
      entity_id: testCase._id,
      action: 'test_case_approved',
      actor_id: new Types.ObjectId(actor.id),
      actor_email: actor.email,
      details: {
        version: testCase.version,
        notes: notes || null
      },
      timestamp: new Date()
    });

    return testCase;
  }

  /**
   * Reject a test case with a documented rejection reason.
   */
  async rejectTestCase(
    testCaseId: string | Types.ObjectId,
    reason: string,
    actor: { id: string | Types.ObjectId; email: string }
  ): Promise<ITestCase> {
    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('A rejection reason is required');
    }

    testCase.review_status = 'rejected';
    testCase.review_notes = reason;
    testCase.reviewed_by = new Types.ObjectId(actor.id);
    testCase.reviewed_at = new Date();
    await testCase.save();

    await AuditEvent.create({
      project_id: testCase.project_id,
      entity_type: 'test_case',
      entity_id: testCase._id,
      action: 'test_case_rejected',
      actor_id: new Types.ObjectId(actor.id),
      actor_email: actor.email,
      details: {
        version: testCase.version,
        reason
      },
      timestamp: new Date()
    });

    return testCase;
  }

  /**
   * Request changes for a test case with specific feedback.
   */
  async requestChangesTestCase(
    testCaseId: string | Types.ObjectId,
    notes: string,
    actor: { id: string | Types.ObjectId; email: string }
  ): Promise<ITestCase> {
    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    if (!notes || notes.trim().length === 0) {
      throw new Error('Feedback notes are required when requesting changes');
    }

    testCase.review_status = 'needs_changes';
    testCase.review_notes = notes;
    testCase.reviewed_by = new Types.ObjectId(actor.id);
    testCase.reviewed_at = new Date();
    await testCase.save();

    await AuditEvent.create({
      project_id: testCase.project_id,
      entity_type: 'test_case',
      entity_id: testCase._id,
      action: 'test_case_needs_changes',
      actor_id: new Types.ObjectId(actor.id),
      actor_email: actor.email,
      details: {
        version: testCase.version,
        notes
      },
      timestamp: new Date()
    });

    return testCase;
  }

  /**
   * List test cases with filtering by project, requirement, review status, etc.
   */
  async listTestCases(
    projectId: string | Types.ObjectId,
    filters: {
      requirement_id?: string | Types.ObjectId;
      review_status?: string;
      scenario_type?: string;
      priority?: string;
      is_current?: boolean;
    } = {}
  ): Promise<ITestCase[]> {
    const query: Record<string, any> = {
      project_id: new Types.ObjectId(projectId),
      is_current: filters.is_current !== undefined ? filters.is_current : true
    };

    if (filters.requirement_id) {
      query.requirement_id = new Types.ObjectId(filters.requirement_id);
    }
    if (filters.review_status) {
      query.review_status = filters.review_status;
    }
    if (filters.scenario_type) {
      query.scenario_type = filters.scenario_type;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }

    return TestCase.find(query).sort({ created_at: -1 });
  }

  /**
   * Retrieve a single test case by ID.
   */
  async getTestCaseById(testCaseId: string | Types.ObjectId): Promise<ITestCase | null> {
    return TestCase.findById(testCaseId);
  }

  /**
   * Retrieve audit history for a project or specific entity.
   */
  async listAuditEvents(
    projectId: string | Types.ObjectId,
    entityId?: string | Types.ObjectId
  ) {
    const query: Record<string, any> = { project_id: new Types.ObjectId(projectId) };
    if (entityId) {
      query.entity_id = new Types.ObjectId(entityId);
    }
    return AuditEvent.find(query).sort({ timestamp: -1 }).limit(50);
  }
}

export const testCasesService = new TestCasesService();

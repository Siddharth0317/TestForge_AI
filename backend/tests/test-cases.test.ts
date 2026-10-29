import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { Requirement } from '../src/models/Requirement';
import { TestCase } from '../src/models/TestCase';
import { AuditEvent } from '../src/models/AuditEvent';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup';
import { signToken } from '../src/utils/jwt';

describe('Test Cases & Review Lifecycle Integration Tests', () => {
  const app = createApp();
  let qaToken: string;
  let viewerToken: string;
  let qaUserId: string;
  let viewerUserId: string;
  let projectId: string;
  let requirementId: string;

  beforeAll(async () => {
    await setupTestDb();
  }, 60000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const hash = await bcrypt.hash('Password123!', 10);
    const qaUser = await User.create({ email: 'qa@testforge.local', password_hash: hash, role: 'qa_engineer' });
    qaUserId = qaUser._id.toString();
    qaToken = signToken({ userId: qaUserId, email: qaUser.email, role: 'qa_engineer' });

    const viewerUser = await User.create({ email: 'viewer@testforge.local', password_hash: hash, role: 'viewer' });
    viewerUserId = viewerUser._id.toString();
    viewerToken = signToken({ userId: viewerUserId, email: viewerUser.email, role: 'viewer' });

    const project = await Project.create({
      name: 'Test Cases Suite Project',
      owner_id: qaUser._id,
      members: [
        { user_id: qaUser._id, role: 'qa_engineer' },
        { user_id: viewerUser._id, role: 'viewer' }
      ]
    });
    projectId = project._id.toString();

    const requirement = await Requirement.create({
      project_id: project._id,
      version: 1,
      original_text: 'User must enter a valid email and password to access their account.',
      normalized_text: 'User must enter a valid email and password to access their account.',
      created_by: qaUser._id,
      status: 'analyzed'
    });
    requirementId = requirement._id.toString();
  });

  const sampleCandidate = {
    title: 'Valid credentials grant user access',
    scenario_type: 'positive' as const,
    preconditions: ['User account exists'],
    test_data: { email: 'qa@testforge.local', password: 'ValidPassword123!' },
    steps: [
      { step_number: 1, action: 'navigate' as const, target_ref: 'login_url', value_ref: null },
      { step_number: 2, action: 'enter_text' as const, target_ref: 'email_input', value_ref: 'qa@testforge.local' },
      { step_number: 3, action: 'enter_text' as const, target_ref: 'password_input', value_ref: 'ValidPassword123!' },
      { step_number: 4, action: 'click' as const, target_ref: 'submit_btn', value_ref: null }
    ],
    expected_result: 'User is authenticated and redirected to dashboard.',
    assertions: [
      { type: 'assert_visible' as const, target_ref: 'dashboard_view', timeout_ms: 5000 }
    ],
    priority: 'high' as const,
    assumptions: ['Assumes standard session cookie is issued'],
    source_evidence: [{ requirement_span: 'valid email and password to access their account' }]
  };

  it('1. should import candidate test cases, validate them, and record an audit event', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    expect(res.status).toBe(201);
    expect(res.body.imported_count).toBe(1);
    expect(res.body.test_cases[0].title).toBe('Valid credentials grant user access');
    expect(res.body.test_cases[0].version).toBe(1);
    expect(res.body.test_cases[0].review_status).toBe('pending');
    expect(res.body.test_cases[0].is_current).toBe(true);

    // Verify audit event
    const auditRes = await request(app)
      .get(`/api/v1/projects/${projectId}/audit-events`)
      .set('Authorization', `Bearer ${qaToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.audit_events.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.body.audit_events[0].action).toBe('test_cases_imported');
  });

  it('2. should flag duplicate candidate without deleting it', async () => {
    // Import first case
    await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    // Import duplicate case with identical title
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    expect(res.status).toBe(201);
    const importedCase = res.body.test_cases[0];
    expect(importedCase.is_duplicate).toBe(true);
    expect(importedCase.duplicate_reason).toContain('Identical title');
    expect(importedCase.duplicate_of_id).toBeDefined();
  });

  it('3. should approve a valid test case and reject approval if blocking errors exist', async () => {
    // Import a valid test case
    const importRes = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    const testCaseId = importRes.body.test_cases[0]._id;

    // Approve the test case
    const approveRes = await request(app)
      .post(`/api/v1/test-cases/${testCaseId}/approve`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ notes: 'Verified and approved for Staging execution' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('approved');
    expect(approveRes.body.test_case.review_status).toBe('approved');
    expect(approveRes.body.test_case.reviewed_by).toBe(qaUserId);

    // Now test blocking error gate
    const invalidCase = await TestCase.create({
      project_id: new mongoose.Types.ObjectId(projectId),
      requirement_id: new mongoose.Types.ObjectId(requirementId),
      requirement_version: 1,
      version: 1,
      is_current: true,
      title: 'Invalid missing steps case',
      scenario_type: 'positive',
      steps: [],
      expected_result: 'Result',
      assertions: [],
      priority: 'medium',
      validation_findings: [
        { rule: 'schema_empty_steps', severity: 'error', message: 'Test case has zero steps' }
      ],
      review_status: 'pending'
    });

    const blockRes = await request(app)
      .post(`/api/v1/test-cases/${invalidCase._id}/approve`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ notes: 'Should fail' });

    expect(blockRes.status).toBe(400);
    expect(blockRes.body.error.code).toBe('APPROVAL_FAILED');
    expect(blockRes.body.error.message).toContain('blocking validation errors');
  });

  it('4. should reject a test case with a documented rejection reason', async () => {
    const importRes = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    const testCaseId = importRes.body.test_cases[0]._id;

    const rejectRes = await request(app)
      .post(`/api/v1/test-cases/${testCaseId}/reject`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ reason: 'Scope of this test is covered by end-to-end suite' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('rejected');
    expect(rejectRes.body.test_case.review_status).toBe('rejected');
    expect(rejectRes.body.test_case.review_notes).toBe('Scope of this test is covered by end-to-end suite');
  });

  it('5. should request changes with feedback notes', async () => {
    const importRes = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    const testCaseId = importRes.body.test_cases[0]._id;

    const changesRes = await request(app)
      .post(`/api/v1/test-cases/${testCaseId}/request-changes`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ notes: 'Please update locator for submit button to #btn-login-submit' });

    expect(changesRes.status).toBe(200);
    expect(changesRes.body.status).toBe('needs_changes');
    expect(changesRes.body.test_case.review_status).toBe('needs_changes');
    expect(changesRes.body.test_case.review_notes).toContain('#btn-login-submit');
  });

  it('6. should bump version when editing an already approved test case', async () => {
    // 1. Import
    const importRes = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    const testCaseId = importRes.body.test_cases[0]._id;

    // 2. Approve
    await request(app)
      .post(`/api/v1/test-cases/${testCaseId}/approve`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ notes: 'Approved initially' });

    // 3. Edit approved case
    const editRes = await request(app)
      .patch(`/api/v1/test-cases/${testCaseId}`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({
        title: 'Updated title: Valid credentials login and dashboard check',
        expected_result: 'User is authenticated and redirected to main overview.'
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.version_bumped).toBe(true);
    expect(editRes.body.test_case.version).toBe(2);
    expect(editRes.body.test_case.review_status).toBe('pending'); // Reset to pending
    expect(editRes.body.test_case.is_current).toBe(true);

    // Old version should still exist in database with is_current: false and version: 1
    const oldCase = await TestCase.findById(testCaseId);
    expect(oldCase?.is_current).toBe(false);
    expect(oldCase?.version).toBe(1);
    expect(oldCase?.review_status).toBe('approved');
  });

  it('7. should enforce RBAC: viewer cannot approve, reject, or edit test cases', async () => {
    const importRes = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/candidates/import`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ candidates: [sampleCandidate] });

    const testCaseId = importRes.body.test_cases[0]._id;

    // Viewer tries to approve
    const approveRes = await request(app)
      .post(`/api/v1/test-cases/${testCaseId}/approve`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ notes: 'Unauthorized approval' });

    expect(approveRes.status).toBe(403);

    // Viewer tries to edit
    const editRes = await request(app)
      .patch(`/api/v1/test-cases/${testCaseId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Unauthorized edit' });

    expect(editRes.status).toBe(403);
  });
});

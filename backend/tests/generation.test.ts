import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { vi } from 'vitest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { Requirement } from '../src/models/Requirement';
import { GenerationJob } from '../src/models/GenerationJob';
import { AIServiceClient } from '../src/services/aiService';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup';
import { signToken } from '../src/utils/jwt';

describe('Generation Router Integration Tests', () => {
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
    vi.restoreAllMocks();

    const hash = await bcrypt.hash('Password123!', 10);
    const qaUser = await User.create({ email: 'qa@testforge.local', password_hash: hash, role: 'qa_engineer' });
    qaUserId = qaUser._id.toString();
    qaToken = signToken({ userId: qaUserId, email: qaUser.email, role: 'qa_engineer' });

    const viewerUser = await User.create({ email: 'viewer@testforge.local', password_hash: hash, role: 'viewer' });
    viewerUserId = viewerUser._id.toString();
    viewerToken = signToken({ userId: viewerUserId, email: viewerUser.email, role: 'viewer' });

    const project = await Project.create({
      name: 'Generation Test Project',
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

  it('POST /generate rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/generate`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('POST /generate rejects viewer role with 403', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/generate`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('POST /generate succeeds with QA role and mock AI response', async () => {
    vi.spyOn(AIServiceClient, 'generateTestCases').mockResolvedValue({
      job_id: 'gen-test-123',
      requirement_id: requirementId,
      requirement_version: 1,
      status: 'completed',
      provider: 'mock',
      model: 'mock-llm-v1',
      prompt_template_version: '1.0.0',
      schema_version: '1.0',
      candidates: [
        {
          schema_version: '1.0',
          test_case_id: 'tc-001',
          requirement_id: requirementId,
          requirement_version: 1,
          title: 'Verify valid credentials login',
          category: 'authentication',
          scenario_type: 'positive',
          preconditions: ['User account exists'],
          test_data: { email: 'user@example.com' },
          steps: [
            { step_number: 1, action: 'navigate', target_ref: 'login_page', value_ref: null },
            { step_number: 2, action: 'click', target_ref: 'login_btn', value_ref: null }
          ],
          expected_result: 'Redirects to dashboard',
          priority: 'high',
          automation_status: 'requires_configuration',
          assumptions: [],
          source_evidence: [{ requirement_span: 'valid email and password' }],
          review_status: 'pending'
        }
      ],
      token_usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
      duration_ms: 150.5
    });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/generate`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({ scenario_types: ['positive'], max_cases: 2 });

    expect(res.status).toBe(200);
    expect(res.body.job).toBeDefined();
    expect(res.body.job.status).toBe('completed');
    expect(res.body.job.provider).toBe('mock');
    expect(res.body.job.candidates).toHaveLength(1);
    expect(res.body.job.candidates[0].title).toBe('Verify valid credentials login');

    // Verify persisted in DB
    const persisted = await GenerationJob.findById(res.body.job._id);
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe('completed');
  });

  it('POST /generate records failure state when AI service is unavailable', async () => {
    vi.spyOn(AIServiceClient, 'generateTestCases').mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements/${requirementId}/generate`)
      .set('Authorization', `Bearer ${qaToken}`)
      .send({});

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');
    expect(res.body.job.status).toBe('failed');
    expect(res.body.job.error_code).toBe('AI_SERVICE_UNAVAILABLE');
  });

  it('GET /generation-jobs lists history for requirement', async () => {
    await GenerationJob.create({
      project_id: projectId,
      requirement_id: requirementId,
      requirement_version: 1,
      requesting_user: qaUserId,
      status: 'completed',
      provider: 'mock',
      model_name: 'mock-llm-v1',
      candidates: []
    });

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/requirements/${requirementId}/generation-jobs`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.jobs[0].provider).toBe('mock');
  });
});

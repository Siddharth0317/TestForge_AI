import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { vi } from 'vitest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { Requirement } from '../src/models/Requirement';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup';
import { signToken } from '../src/utils/jwt';

describe('Requirements & Environments Integration Tests', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    await setupTestDb();
  }, 60000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const hash = await bcrypt.hash('Password123!', 10);
    const user = await User.create({ email: 'qa@testforge.local', password_hash: hash, role: 'qa_engineer' });
    userId = user._id.toString();
    userToken = signToken({ userId, email: user.email, role: 'qa_engineer' });

    const project = await Project.create({
      name: 'Test Project',
      owner_id: user._id,
      members: [{ user_id: user._id, role: 'qa_engineer' }]
    });
    projectId = project._id.toString();
  });

  it('POST /api/v1/projects/:projectId/requirements creates requirement with version 1', async () => {
    const rawText = 'When the user submits the contact form with an invalid email, display an error banner.';
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        original_text: rawText,
        source_metadata: { jira_key: 'QA-401' }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.original_text).toBe(rawText);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.created_by).toBe(userId);
  });

  it('POST /api/v1/projects/:projectId/requirements rejects too short text with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/requirements`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        original_text: 'abc' // less than 5 characters
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('PATCH /api/v1/requirements/:requirementId increments version counter on edit', async () => {
    const requirement = await Requirement.create({
      project_id: new mongoose.Types.ObjectId(projectId),
      version: 1,
      original_text: 'Initial requirement text version 1.',
      normalized_text: 'Initial requirement text version 1.',
      status: 'analyzed',
      created_by: new mongoose.Types.ObjectId(userId)
    });

    const res = await request(app)
      .patch(`/api/v1/requirements/${requirement._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        original_text: 'Updated requirement text version 2.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe(2);
    expect(res.body.data.original_text).toBe('Updated requirement text version 2.');
    expect(res.body.data.status).toBe('draft');
  });

  it('POST /api/v1/requirements/:requirementId/analyze updates requirement with nlp_analysis', async () => {
    const requirement = await Requirement.create({
      project_id: new mongoose.Types.ObjectId(projectId),
      version: 1,
      original_text: 'When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes.',
      normalized_text: 'When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes.',
      status: 'draft',
      created_by: new mongoose.Types.ObjectId(userId)
    });

    // Spy on AIServiceClient.analyzeRequirement
    const { AIServiceClient } = await import('../src/services/aiService');
    const spy = vi.spyOn(AIServiceClient, 'analyzeRequirement').mockResolvedValueOnce({
      version: 1,
      normalized_text: 'When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes.',
      actors: ['customer'],
      actions: ['enter', 'lock'],
      entities: ['password', 'login form'],
      conditions: ['When a customer enters an incorrect password three consecutive times'],
      constraints: ['15 minutes', 'three consecutive times'],
      outcomes: ['the login form must be locked for 15 minutes'],
      ambiguity_findings: [],
      evidence_spans: [
        { category: 'actor', text: 'customer', start_char: 7, end_char: 15, confidence: 0.9 }
      ],
      processing_version: 'spacy-3.8-rule-v1'
    });

    const classifySpy = vi.spyOn(AIServiceClient, 'classifyRequirement').mockResolvedValueOnce({
      category: 'authentication',
      confidence: 0.88,
      model_version: 'v1.0.0-baseline',
      is_uncertain: false
    });

    const res = await request(app)
      .post(`/api/v1/requirements/${requirement._id}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('analyzed');
    expect(res.body.data.nlp_analysis.actors).toContain('customer');
    expect(res.body.data.nlp_analysis.constraints).toContain('15 minutes');
    expect(res.body.data.nlp_analysis.processing_version).toBe('spacy-3.8-rule-v1');
    expect(res.body.data.ml_classification.category).toBe('authentication');
    expect(res.body.data.ml_classification.confidence).toBe(0.88);

    spy.mockRestore();
    classifySpy.mockRestore();
  });

  it('POST /api/v1/requirements/:requirementId/analyze returns 502 when AI service fails', async () => {
    const requirement = await Requirement.create({
      project_id: new mongoose.Types.ObjectId(projectId),
      version: 1,
      original_text: 'User enters credentials.',
      normalized_text: 'User enters credentials.',
      status: 'draft',
      created_by: new mongoose.Types.ObjectId(userId)
    });

    const { AIServiceClient } = await import('../src/services/aiService');
    const spy = vi.spyOn(AIServiceClient, 'analyzeRequirement').mockResolvedValueOnce(null);

    const res = await request(app)
      .post(`/api/v1/requirements/${requirement._id}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_SERVICE_UNAVAILABLE');

    spy.mockRestore();
  });

  it('POST /api/v1/projects/:projectId/environments saves target environment and locators', async () => {
    // Make user an admin on project to allow creating environments
    await Project.findByIdAndUpdate(projectId, {
      $set: { 'members.0.role': 'admin' }
    });
    const adminToken = signToken({ userId, email: 'qa@testforge.local', role: 'admin' });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/environments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Staging Environment',
        base_url: 'https://staging.example.com',
        allowed_hosts: ['staging.example.com'],
        environment_type: 'staging',
        locators: [
          {
            key: 'submit_btn',
            page: 'login',
            strategy: 'css',
            value: 'button#submit'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Staging Environment');
    expect(res.body.data.locators[0].key).toBe('submit_btn');
  });
});


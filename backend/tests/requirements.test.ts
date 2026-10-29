import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
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


import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup';
import { signToken } from '../src/utils/jwt';

describe('Projects Module Integration Tests', () => {
  const app = createApp();
  let userAToken: string;
  let userBToken: string;
  let adminToken: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    await setupTestDb();
  }, 60000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const hash = await bcrypt.hash('Password123!', 10);

    const userA = await User.create({ email: 'userA@testforge.local', password_hash: hash, role: 'qa_engineer' });
    const userB = await User.create({ email: 'userB@testforge.local', password_hash: hash, role: 'qa_engineer' });
    const admin = await User.create({ email: 'admin@testforge.local', password_hash: hash, role: 'admin' });

    userAId = userA._id.toString();
    userBId = userB._id.toString();

    userAToken = signToken({ userId: userAId, email: userA.email, role: 'qa_engineer' });
    userBToken = signToken({ userId: userBId, email: userB.email, role: 'qa_engineer' });
    adminToken = signToken({ userId: admin._id.toString(), email: admin.email, role: 'admin' });
  });

  it('POST /api/v1/projects creates a new project with current user as owner', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Project Alpha',
        description: 'First test project'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Project Alpha');
    expect(res.body.data.owner_id).toBe(userAId);
    expect(res.body.data.members[0].user_id).toBe(userAId);
  });

  it('POST /api/v1/projects rejects missing project name with 400', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('GET /api/v1/projects enforces cross-project isolation between users', async () => {
    // User A creates project
    await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'User A Secret Project' });

    // User B lists projects -> should be empty
    const listB = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);

    // User A lists projects -> 1 project
    const listA = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(listA.status).toBe(200);
    expect(listA.body.data.length).toBe(1);
    expect(listA.body.data[0].name).toBe('User A Secret Project');
  });

  it('GET /api/v1/projects/:projectId rejects access to non-member with 403', async () => {
    const project = await Project.create({
      name: 'Private Project',
      owner_id: new mongoose.Types.ObjectId(userAId),
      members: [{ user_id: new mongoose.Types.ObjectId(userAId), role: 'qa_engineer' }]
    });

    // User B tries to read project details
    const res = await request(app)
      .get(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Admin user can view any project regardless of direct membership', async () => {
    const project = await Project.create({
      name: 'Confidential Project',
      owner_id: new mongoose.Types.ObjectId(userAId),
      members: [{ user_id: new mongoose.Types.ObjectId(userAId), role: 'qa_engineer' }]
    });

    const res = await request(app)
      .get(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Confidential Project');
    expect(res.body.data.summary).toHaveProperty('requirements_count', 0);
  });
});


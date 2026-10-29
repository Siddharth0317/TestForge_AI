import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { setupTestDb, teardownTestDb, clearTestDb } from './setup';

describe('Auth Module Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDb();
  }, 60000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const password_hash = await bcrypt.hash('CorrectPassword123!', 10);
    await User.create({
      email: 'tester@testforge.local',
      password_hash,
      role: 'qa_engineer',
      status: 'active'
    });
  });

  it('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tester@testforge.local',
        password: 'CorrectPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toEqual({
      id: expect.any(String),
      email: 'tester@testforge.local',
      role: 'qa_engineer'
    });
  });

  it('POST /api/v1/auth/login rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tester@testforge.local',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('POST /api/v1/auth/login rejects invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/auth/me returns authenticated user profile', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tester@testforge.local',
        password: 'CorrectPassword123!'
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('tester@testforge.local');
    expect(meRes.body.data.role).toBe('qa_engineer');
  });

  it('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });
});


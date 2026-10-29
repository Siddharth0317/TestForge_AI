import request from 'supertest';
import { createApp } from '../src/app';

describe('Backend Foundation Health & Readiness Endpoints', () => {
  const app = createApp();

  it('GET /health returns 200 with service status and request ID', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'testforge-backend');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(res.body).toHaveProperty('request_id');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /ready returns 200 with readiness verification', async () => {
    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ready');
    expect(res.body).toHaveProperty('service', 'testforge-backend');
    expect(res.body.checks).toHaveProperty('environment', 'configured');
  });

  it('GET /api/v1 returns 200 with API version metadata', async () => {
    const res = await request(app).get('/api/v1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'TestForge AI Core API');
    expect(res.body).toHaveProperty('version', '1.0.0');
  });

  it('GET /non-existent-route returns 404 in standard error envelope', async () => {
    const res = await request(app).get('/unknown-path-for-testing');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('request_id');
    expect(res.body.error).toHaveProperty('timestamp');
  });
});


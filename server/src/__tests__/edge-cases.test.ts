import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, createAdminAndGetToken } from './setup';
import app from '../app';

describe('Edge Case Tests', () => {
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDB();
    const admin = await createAdminAndGetToken();
    adminToken = admin.accessToken;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('health endpoint should work without auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('uptime');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'weak@test.com', password: '123', fullName: 'Weak Pass' });
    expect(res.status).toBe(400);
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email', password: 'StrongPass123', fullName: 'Bad Email' });
    expect(res.status).toBe(400);
  });

  it('should reject login with empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('should handle invalid ObjectId gracefully', async () => {
    const res = await request(app)
      .get('/api/projects/not-a-valid-id/sites')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should require minimum 2 chars for search', async () => {
    const res = await request(app)
      .get('/api/search?q=a')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should reject oversized JSON body', async () => {
    const hugeBody = { data: 'x'.repeat(11 * 1024 * 1024) };
    const res = await request(app).post('/api/auth/login').send(hugeBody);
    expect([413, 500]).toContain(res.status);
  });
});

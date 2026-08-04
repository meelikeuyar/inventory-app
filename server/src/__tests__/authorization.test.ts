import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB, createAdminAndGetToken } from './setup';
import app from '../app';

describe('Authorization Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  const engineerUser = { email: 'engineer@test.com', password: 'Engineer123', fullName: 'Engineer User' };
  const viewerUser = { email: 'viewer@test.com', password: 'Viewer123', fullName: 'Viewer User' };

  async function registerAndGetToken(user: typeof engineerUser, role?: string) {
    const admin = await createAdminAndGetToken();

    // Admin registers the user
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(user);

    if (role && role !== 'engineer') {
      const { User } = await import('../models/User');
      await User.findByIdAndUpdate(res.body.user.id, { role });
      const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
      return loginRes.body.accessToken;
    }
    return res.body.accessToken;
  }

  it('viewer should NOT be able to create a project', async () => {
    const token = await registerAndGetToken(viewerUser, 'viewer');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' });
    expect(res.status).toBe(403);
  });

  it('admin should be able to create a project', async () => {
    const admin = await createAdminAndGetToken();
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Test Project' });
    expect(res.status).toBe(201);
  });

  it('engineer should NOT be able to delete a project', async () => {
    const admin = await createAdminAndGetToken();
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'To Delete' });

    const engToken = await registerAndGetToken(engineerUser, 'engineer');
    const res = await request(app)
      .delete(`/api/projects/${projRes.body._id}`)
      .set('Authorization', `Bearer ${engToken}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated request should return 401', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('invalid token should return 401', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });

  it('viewer should be able to list projects (read-only)', async () => {
    const token = await registerAndGetToken(viewerUser, 'viewer');
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

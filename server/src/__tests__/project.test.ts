import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, createAdminAndGetToken } from './setup';
import app from '../app';

describe('Project Endpoints', () => {
  let token: string;
  let otherToken: string;
  let projectId: string;

  beforeAll(async () => {
    await setupTestDB();

    const admin = await createAdminAndGetToken();
    token = admin.accessToken;

    // Register another user (engineer) via admin for isolation tests
    const res2 = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'other-user@test.com', password: 'pass123456', fullName: 'Other User' });
    otherToken = res2.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('POST /api/projects - should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'Desc' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project');
    projectId = res.body._id || res.body.id;
  });

  it('GET /api/projects - should list user projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('PUT /api/projects/:id - should update own project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Project');
  });

  it('GET /api/projects - other user should not see this project', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('DELETE /api/projects/:id - should cascade delete', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/sites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Site', code: 'TST' });

    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('silindi');
  });
});

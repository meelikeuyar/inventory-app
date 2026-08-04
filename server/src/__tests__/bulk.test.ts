import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup';
import app from '../app';

describe('Bulk Operations Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  let token: string;
  let projectId: string;
  let siteId: string;

  async function setupProjectAndSite() {
    // Register admin
    const regRes = await request(app).post('/api/auth/register').send({
      email: 'bulk@test.com', password: 'BulkTest123', fullName: 'Bulk Tester',
    });
    token = regRes.body.accessToken;

    // Set admin role
    const { User } = await import('../models/User');
    await User.findByIdAndUpdate(regRes.body.user.id, { role: 'admin' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'bulk@test.com', password: 'BulkTest123' });
    token = loginRes.body.accessToken;

    // Create project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bulk Test Project' });
    projectId = projRes.body._id;

    // Create site
    const siteRes = await request(app)
      .post(`/api/projects/${projectId}/sites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bulk Site', code: 'BLK' });
    siteId = siteRes.body._id;
  }

  it('should bulk import items', async () => {
    await setupProjectAndSite();
    const items = Array.from({ length: 5 }, (_, i) => ({
      name: `Server-${i + 1}`,
      vendor: 'Dell',
      status: 'active',
    }));

    const res = await request(app)
      .post(`/api/projects/${projectId}/sites/${siteId}/items/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(5);
  });

  it('should reject bulk import with empty items', async () => {
    await setupProjectAndSite();
    const res = await request(app)
      .post(`/api/projects/${projectId}/sites/${siteId}/items/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should bulk delete items', async () => {
    await setupProjectAndSite();

    // Create items first
    const item1 = await request(app)
      .post(`/api/projects/${projectId}/sites/${siteId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete-1' });
    const item2 = await request(app)
      .post(`/api/projects/${projectId}/sites/${siteId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete-2' });

    const res = await request(app)
      .post(`/api/projects/${projectId}/sites/${siteId}/items/bulk-delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itemIds: [item1.body._id, item2.body._id] });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('should return error for invalid project in bulk ops', async () => {
    await setupProjectAndSite();
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post(`/api/projects/${fakeId}/sites/${siteId}/items/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ name: 'Test' }] });

    expect(res.status).toBe(404);
  });
});

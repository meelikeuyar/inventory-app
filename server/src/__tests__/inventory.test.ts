import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, createAdminAndGetToken } from './setup';
import app from '../app';

describe('Inventory Endpoints', () => {
  let token: string;
  let projectId: string;
  let siteId: string;
  let itemId: string;

  beforeAll(async () => {
    await setupTestDB();

    const admin = await createAdminAndGetToken();
    token = admin.accessToken;

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Inv Project' });
    projectId = projRes.body._id || projRes.body.id;

    const siteRes = await request(app)
      .post(`/api/projects/${projectId}/sites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'DC Ankara', code: 'ANK' });
    siteId = siteRes.body._id || siteRes.body.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  const basePath = () => `/api/projects/${projectId}/sites/${siteId}/items`;

  it('POST items - should create an inventory item', async () => {
    const res = await request(app)
      .post(basePath())
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Server-01', ipAddress: '10.0.0.1', serialNumber: 'SN-001', vendor: 'Dell', status: 'active' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Server-01');
    expect(res.body.vendor).toBe('Dell');
    itemId = res.body._id || res.body.id;
  });

  it('GET items - should list items with pagination', async () => {
    const res = await request(app)
      .get(basePath())
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('POST items/bulk - should bulk import items', async () => {
    const res = await request(app)
      .post(`${basePath()}/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { name: 'Switch-01', vendor: 'Cisco', status: 'active' },
          { name: 'Router-01', vendor: 'Juniper', status: 'inactive' },
          { name: 'Firewall-01', vendor: 'Fortinet', status: 'active' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(3);
  });

  it('GET items - should filter by vendor', async () => {
    const res = await request(app)
      .get(`${basePath()}?vendor=Dell`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].vendor).toBe('Dell');
  });

  it('GET items - should filter by status', async () => {
    const res = await request(app)
      .get(`${basePath()}?status=inactive`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].name).toBe('Router-01');
  });

  it('PUT items/:id - should update an item', async () => {
    const res = await request(app)
      .put(`${basePath()}/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Server-01-Updated', ipAddress: '10.0.0.1', status: 'maintenance' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Server-01-Updated');
  });

  it('DELETE items/:id - should delete an item', async () => {
    const res = await request(app)
      .delete(`${basePath()}/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('silindi');
  });

  it('GET items - should paginate correctly', async () => {
    const res = await request(app)
      .get(`${basePath()}?page=1&limit=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
  });
});

import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

// Integration test — requires running server + MongoDB
// Run with: npm run dev (in another terminal), then npm run test

describe('API Integration Tests', () => {
  const API_URL = 'http://localhost:5000/api';
  let accessToken: string;
  let projectId: string;
  let siteId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'test123456';

  describe('Health Check', () => {
    it('GET /api/health should return healthy status', async () => {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('memory');
    });
  });

  describe('Auth Flow', () => {
    it('POST /auth/register should create a new user', async () => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword, fullName: 'Test User' }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user.email).toBe(testEmail);
    });

    it('should promote user to admin and re-login', async () => {
      // Connect to MongoDB directly to promote user role
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventorydb';
      const conn = await mongoose.createConnection(mongoUri).asPromise();
      const usersCollection = conn.collection('users');
      await usersCollection.updateOne({ email: testEmail }, { $set: { role: 'admin' } });
      await conn.close();

      // Re-login to get token with admin role
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('accessToken');
      accessToken = data.accessToken;
    });

    it('GET /auth/me should return current user', async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.user.email).toBe(testEmail);
    });

    it('should reject request without token', async () => {
      const res = await fetch(`${API_URL}/projects`);
      expect(res.status).toBe(401);
    });
  });

  describe('Projects CRUD', () => {
    it('POST /projects should create a project', async () => {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Test Project', description: 'Integration test' }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('Test Project');
      projectId = data._id || data.id;
    });

    it('GET /projects should list projects', async () => {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('PUT /projects/:id should update a project', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Updated Project' }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Project');
    });
  });

  describe('Sites CRUD', () => {
    it('POST /projects/:pid/sites should create a site', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Ankara DC', code: 'ANK' }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('Ankara DC');
      expect(data.code).toBe('ANK');
      siteId = data._id || data.id;
    });
  });

  describe('Inventory CRUD', () => {
    let itemId: string;

    it('POST items should create an inventory item', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites/${siteId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Server-01', ipAddress: '10.0.0.1', serialNumber: 'SN-001' }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('Server-01');
      itemId = data._id || data.id;
    });

    it('GET items should list items with pagination', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites/${siteId}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('pagination');
      expect(data.pagination.total).toBeGreaterThan(0);
    });

    it('POST items/bulk should import multiple items', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites/${siteId}/items/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          items: [
            { name: 'Switch-01', ipAddress: '10.0.0.2', serialNumber: 'SN-002' },
            { name: 'Router-01', ipAddress: '10.0.0.3', serialNumber: 'SN-003' },
          ],
        }),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.count).toBe(2);
    });

    it('DELETE items/:id should delete an item', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites/${siteId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Validation', () => {
    it('should reject invalid project name', async () => {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: '' }),
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid site code', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Test', code: 'A' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /projects/:id should cascade delete', async () => {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);
    });
  });
});

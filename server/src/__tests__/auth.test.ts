import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, createAdminAndGetToken } from './setup';
import app from '../app';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  const testUser = {
    email: 'auth-test@example.com',
    password: 'password123',
    fullName: 'Auth Test User',
  };

  let accessToken: string;
  let refreshToken: string;
  let adminToken: string;

  // 1 — Register is admin-only, so we need an admin token first
  it('POST /api/auth/register - should register a new user (admin-only)', async () => {
    const admin = await createAdminAndGetToken();
    adminToken = admin.accessToken;

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.fullName).toBe(testUser.fullName);
    expect(res.body.user.role).toBe('engineer');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  // 2
  it('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('zaten');
  });

  // 3
  it('POST /api/auth/login - should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe(testUser.email);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  // 4
  it('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('hatalı');
  });

  // 5
  it('GET /api/auth/me - should return user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  // 6
  it('GET /api/auth/me - should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // 7
  it('POST /api/auth/refresh - should return new tokens', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  // 8 — Register without auth should fail
  it('POST /api/auth/register - should reject unauthenticated register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noauth@test.com', password: 'Test123', fullName: 'No Auth' });

    expect(res.status).toBe(401);
  });
});

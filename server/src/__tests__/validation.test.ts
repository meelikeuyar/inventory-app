import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, projectSchema, siteSchema, inventoryItemSchema } from '../validators/schemas';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/token';

// Set test env vars
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123456',
        fullName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid',
        password: '123456',
        fullName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123456',
        fullName: 'A',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('projectSchema', () => {
    it('should accept valid project', () => {
      const result = projectSchema.safeParse({ name: 'My Project' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = projectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('siteSchema', () => {
    it('should accept valid site and uppercase code', () => {
      const result = siteSchema.safeParse({ name: 'Ankara', code: 'ank' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('ANK');
      }
    });

    it('should reject short code', () => {
      const result = siteSchema.safeParse({ name: 'Ankara', code: 'A' });
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryItemSchema', () => {
    it('should accept valid item', () => {
      const result = inventoryItemSchema.safeParse({ name: 'Server-01' });
      expect(result.success).toBe(true);
    });

    it('should set defaults for optional fields', () => {
      const result = inventoryItemSchema.safeParse({ name: 'Server-01' });
      if (result.success) {
        expect(result.data.ipAddress).toBe('');
        expect(result.data.serialNumber).toBe('');
      }
    });
  });
});

describe('JWT Token Utils', () => {
  const payload = { userId: '123abc', role: 'user' };

  it('should generate and verify access token', () => {
    const token = generateAccessToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should generate and verify refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(token).toBeTruthy();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should fail verification with wrong secret', () => {
    const token = generateAccessToken(payload);
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});

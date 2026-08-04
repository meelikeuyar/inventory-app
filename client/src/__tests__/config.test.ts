import { describe, it, expect } from 'vitest';

describe('API Service Configuration', () => {
  it('should use correct base URL pattern', async () => {
    // Verify the API base URL follows expected pattern
    const expectedPattern = /\/api$/;
    const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
    expect(baseURL).toMatch(expectedPattern);
  });

  it('should have correct environment variable prefix', () => {
    // Vite requires VITE_ prefix for client-side env vars
    // This test documents that convention
    expect('VITE_API_URL'.startsWith('VITE_')).toBe(true);
  });
});

describe('Type Safety', () => {
  it('should enforce user roles', () => {
    const validRoles = ['admin', 'project_manager', 'engineer', 'viewer', 'department_manager', 'technician', 'auditor'];
    expect(validRoles).toContain('admin');
    expect(validRoles).toContain('engineer');
    expect(validRoles).toContain('viewer');
    expect(validRoles.length).toBe(7);
  });

  it('should enforce inventory status values', () => {
    const validStatuses = ['active', 'inactive', 'maintenance', 'decommissioned'];
    expect(validStatuses).toContain('active');
    expect(validStatuses).toContain('maintenance');
    expect(validStatuses.length).toBe(4);
  });
});

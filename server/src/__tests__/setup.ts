import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Set required env vars for tests
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Creates an admin user directly in DB and returns its JWT token.
 * Use this in tests that need to call admin-only endpoints (like register).
 */
export async function createAdminAndGetToken() {
  const { User } = await import('../models/User');
  const { generateAccessToken, generateRefreshToken } = await import('../utils/token');

  const admin = await User.create({
    email: `admin-${Date.now()}@test.com`,
    password: 'AdminTest123',
    fullName: 'Test Admin',
    role: 'admin',
  });

  const accessToken = generateAccessToken({ userId: admin.id, role: admin.role });
  const refreshToken = generateRefreshToken({ userId: admin.id, role: admin.role });

  return { accessToken, refreshToken, user: admin };
}

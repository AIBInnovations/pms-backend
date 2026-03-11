import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import supertest from 'supertest';
import { connectDB, disconnectDB, clearDB } from './setup.js';

// Suppress dotenv logging in tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

let app;
let request;

beforeAll(async () => {
  await connectDB();
  // Dynamic import after DB is connected so models register correctly
  const mod = await import('../src/app.js');
  app = mod.default;
  request = supertest(app);
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request.post('/api/v1/auth/register').send(testUser);
      const res = await request.post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send({ ...testUser, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request.post('/api/v1/auth/register').send(testUser);

      const res = await request
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request.post('/api/v1/auth/register').send(testUser);

      const res = await request
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123!' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request.get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('running');
    });
  });
});

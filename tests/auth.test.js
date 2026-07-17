const request = require('supertest');
const app = require('../src/app');
const {
  connectTestDB,
  clearTestDB,
  closeTestDB,
} = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Auth API', () => {
  test('registers a user and returns token', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        username: 'user1',
        password: 'password123',
      })
      .expect(201);

    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toBe('user1');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
  });

  test('logs in a user and returns token', async () => {
    await request(app)
      .post('/register')
      .send({
        username: 'user1',
        password: 'password123',
      })
      .expect(201);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'user1',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.user.username).toBe('user1');
    expect(response.body.token).toBeDefined();
  });

  test('rejects protected route without token', async () => {
    const response = await request(app)
      .get('/me')
      .expect(401);

    expect(response.body.message).toBe('Not authorized, no token provided');
  });

  test('returns current user with valid token', async () => {
    const registerResponse = await request(app)
      .post('/register')
      .send({
        username: 'user1',
        password: 'password123',
      })
      .expect(201);

    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .expect(200);

    expect(response.body.user.username).toBe('user1');
  });
});
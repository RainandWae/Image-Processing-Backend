const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
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

describe('Admin API', () => {
  test('blocks normal users from admin routes', async () => {
    const userResponse = await request(app)
      .post('/api/v1/register')
      .send({
        username: 'normaluser',
        password: 'password123',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${userResponse.body.token}`)
      .expect(403);

    expect(response.body.message).toBe('Forbidden: insufficient permissions');
  });

  test('allows admin users to list users', async () => {
    const admin = await User.create({
      username: 'adminuser',
      password: 'password123',
      role: 'admin',
    });

    const loginResponse = await request(app)
      .post('/api/v1/login')
      .send({
        username: 'adminuser',
        password: 'password123',
      })
      .expect(200);

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(response.body.count).toBe(1);
    expect(response.body.users[0].username).toBe(admin.username);
    expect(response.body.users[0].role).toBe('admin');
    expect(response.body.users[0].password).toBeUndefined();
    expect(response.body.users[0].refreshTokenHash).toBeUndefined();
  });

  test('allows admin users to view filtered audit logs', async () => {
    await User.create({
      username: 'auditadmin',
      password: 'password123',
      role: 'admin',
    });

    const loginResponse = await request(app)
      .post('/api/v1/login')
      .send({
        username: 'auditadmin',
        password: 'password123',
      })
      .expect(200);

    await request(app)
      .post('/api/v1/register')
      .send({
        username: 'auditeduser',
        password: 'password123',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/v1/admin/audit-logs?action=USER_REGISTERED')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.auditLogs[0].action).toBe('USER_REGISTERED');
    expect(response.body.auditLogs[0].actor.username).toBe('auditeduser');
  });

  test('rejects invalid audit log actor filter', async () => {
    await User.create({
      username: 'filteradmin',
      password: 'password123',
      role: 'admin',
    });

    const loginResponse = await request(app)
      .post('/api/v1/login')
      .send({
        username: 'filteradmin',
        password: 'password123',
      })
      .expect(200);

    const response = await request(app)
      .get('/api/v1/admin/audit-logs?actor=bad-id')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(400);

    expect(response.body.message).toBe('Invalid actor id');
  });
});

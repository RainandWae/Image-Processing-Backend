const fs = require('fs');
const request = require('supertest');
const app = require('../src/app');
const {
  connectTestDB,
  clearTestDB,
  closeTestDB,
} = require('./setup');
const createTestImage = require('./fixtures/createTestImage');

let token;
let imagePath;

const registerAndLogin = async () => {
  const response = await request(app)
    .post('/register')
    .send({
      username: 'user1',
      password: 'password123',
    });

  return response.body.token;
};

beforeAll(async () => {
  await connectTestDB();
  imagePath = await createTestImage();
});

beforeEach(async () => {
  token = await registerAndLogin();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();

  if (imagePath && fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
});

describe('Images API', () => {
  test('rejects upload without token', async () => {
    const response = await request(app)
      .post('/images')
      .expect(401);

    expect(response.body.message).toBe('Not authorized, no token provided');
  });

  test('uploads an image', async () => {
    const response = await request(app)
      .post('/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.url).toContain('/uploads/originals/');
    expect(response.body.metadata.width).toBe(400);
    expect(response.body.metadata.height).toBe(300);
  });

  test('lists images', async () => {
    await request(app)
      .post('/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const response = await request(app)
      .get('/images?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.images).toHaveLength(1);
  });

  test('gets image by id', async () => {
    const uploadResponse = await request(app)
      .post('/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const response = await request(app)
      .get(`/images/${uploadResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.image._id).toBe(uploadResponse.body.id);
  });

  test('returns 400 for invalid image id', async () => {
    const response = await request(app)
      .get('/images/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.message).toBe('Invalid id');
  });

  test('deletes an image', async () => {
    const uploadResponse = await request(app)
      .post('/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const response = await request(app)
      .delete(`/images/${uploadResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.deletedCount).toBe(1);

    await request(app)
      .get(`/images/${uploadResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

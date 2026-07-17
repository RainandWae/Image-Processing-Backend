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

const registerAndUploadImage = async () => {
  const registerResponse = await request(app)
    .post('/register')
    .send({
      username: 'user1',
      password: 'password123',
    })
    .expect(201);

  const userToken = registerResponse.body.token;

  const uploadResponse = await request(app)
    .post('/images')
    .set('Authorization', `Bearer ${userToken}`)
    .attach('image', imagePath)
    .expect(201);

  return {
    token: userToken,
    imageId: uploadResponse.body.id,
  };
};

beforeAll(async () => {
  await connectTestDB();
  imagePath = await createTestImage();
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

describe('Transform API', () => {
  test('resizes an image', async () => {
    const setup = await registerAndUploadImage();

    const response = await request(app)
      .post(`/images/${setup.imageId}/transform`)
      .set('Authorization', `Bearer ${setup.token}`)
      .send({
        transformations: {
          resize: {
            width: 200,
            height: 200,
          },
          format: 'png',
        },
      })
      .expect(201);

    expect(response.body.metadata.width).toBe(200);
    expect(response.body.metadata.height).toBe(200);
    expect(response.body.metadata.format).toBe('png');
  });

  test('returns cached transformed image for duplicate transform', async () => {
    const setup = await registerAndUploadImage();

    const body = {
      transformations: {
        resize: {
          width: 250,
          height: 250,
        },
        format: 'webp',
      },
    };

    const firstResponse = await request(app)
      .post(`/images/${setup.imageId}/transform`)
      .set('Authorization', `Bearer ${setup.token}`)
      .send(body)
      .expect(201);

    expect(firstResponse.body.cached).toBe(false);

    const secondResponse = await request(app)
      .post(`/images/${setup.imageId}/transform`)
      .set('Authorization', `Bearer ${setup.token}`)
      .send(body)
      .expect(200);

    expect(secondResponse.body.cached).toBe(true);
    expect(secondResponse.body.id).toBe(firstResponse.body.id);
  });

  test('rejects invalid transform input', async () => {
    const setup = await registerAndUploadImage();

    const response = await request(app)
      .post(`/images/${setup.imageId}/transform`)
      .set('Authorization', `Bearer ${setup.token}`)
      .send({
        transformations: {
          resize: {
            width: 'bad',
          },
        },
      })
      .expect(400);

    expect(response.body.message).toBe(
      'Resize width must be a positive integer up to 5000'
    );
  });
});

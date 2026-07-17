const fs = require('fs');
const request = require('supertest');
const app = require('../src/app');
const {
  connectTestDB,
  clearTestDB,
  closeTestDB,
} = require('./setup');
const createTestImage = require('./fixtures/createTestImage');

let imagePath;

const registerUser = async (username = 'user1') => {
  const response = await request(app)
    .post('/register')
    .send({
      username,
      password: 'password123',
    })
    .expect(201);

  return response.body.token;
};

const uploadImage = async (token) => {
  const response = await request(app)
    .post('/images')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', imagePath)
    .expect(201);

  return response.body.id;
};

const waitForCompletedJob = async (token, jobId) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await request(app)
      .get(`/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    if (response.body.job.status === 'completed') {
      return response.body.job;
    }

    if (response.body.job.status === 'failed') {
      throw new Error(response.body.job.error || 'Job failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Job did not complete in time');
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

describe('Jobs API', () => {
  test('creates a transform job', async () => {
    const token = await registerUser();
    const imageId = await uploadImage(token);

    const response = await request(app)
      .post(`/images/${imageId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        transformations: {
          resize: {
            width: 200,
            height: 200,
          },
          format: 'webp',
        },
      })
      .expect(202);

    expect(response.body.id).toBeDefined();
    expect(response.body.type).toBe('transform');
    expect(response.body.status).toBe('pending');
    expect(response.body.image).toBe(imageId);

    await waitForCompletedJob(token, response.body.id);
  });

  test('completes a transform job and returns result image', async () => {
    const token = await registerUser();
    const imageId = await uploadImage(token);

    const createResponse = await request(app)
      .post(`/images/${imageId}/jobs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        transformations: {
          resize: {
            width: 220,
            height: 220,
          },
          format: 'png',
        },
      })
      .expect(202);

    const job = await waitForCompletedJob(token, createResponse.body.id);

    expect(job.status).toBe('completed');
    expect(job.resultImage).toBeDefined();
    expect(job.resultImage.width).toBe(220);
    expect(job.resultImage.height).toBe(220);
    expect(job.resultImage.format).toBe('png');
  });

  test('returns 400 for invalid job id', async () => {
    const token = await registerUser();

    const response = await request(app)
      .get('/jobs/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.message).toBe('Invalid id');
  });

  test('does not allow another user to access a job', async () => {
    const ownerToken = await registerUser('owner');
    const otherToken = await registerUser('other');
    const imageId = await uploadImage(ownerToken);

    const createResponse = await request(app)
      .post(`/images/${imageId}/jobs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        transformations: {
          format: 'webp',
        },
      })
      .expect(202);

    await request(app)
      .get(`/jobs/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await waitForCompletedJob(ownerToken, createResponse.body.id);
  });
});

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectTestDB = async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.BASE_URL = 'http://localhost:5000';

    await mongoose.connect(process.env.MONGO_URI);
};

const clearTestDB = async () => {
    const collections = mongoose.connection.collections;

    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
};

const closeTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
        await mongoServer.stop();
    }
};

module.exports = {
    connectTestDB,
    clearTestDB,
    closeTestDB,
};

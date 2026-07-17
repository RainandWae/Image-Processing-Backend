// connect to MongoDB
const app = require('./app');
const connectDB = require('./config/db');
const { env, validateEnv } = require('./config/env');

const startServer = async () => {
    validateEnv();
    await connectDB();

    app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
    });
};

// start express server
startServer();

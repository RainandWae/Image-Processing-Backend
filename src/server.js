// load .env
require('dotenv').config();

// connect to MongoDB
const app = require('./app');
const connectDB = require('./config/db');
const validateEnv = require('./config/env');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    validateEnv();
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

// start express server
startServer();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const imageRoutes = require('./routes/image.routes')

const app = express();

// create express app, add basic security with helmet
// enable CORS, allow json request bodies

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

// serves uploaded files later from /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// add test endpoint: GET /health
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Image Processing Service API is running',
  });
});

app.use('/', authRoutes)
app.use('/', imageRoutes)

// fallback for invalid routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

module.exports = app;

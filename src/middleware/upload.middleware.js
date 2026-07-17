// Saves uploaded images to uploads/originals
// Gives each file a unique name
// Allows only JPEG, PNG, WebP
// Limits files to 5 MB

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');

const originalsDir = path.join('uploads', 'originals');
const transformedDir = path.join('uploads', 'transformed');

fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(transformedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, originalsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    const error = new Error('Only JPEG, PNG, and WebP images are allowed');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.uploadMaxFileSizeBytes,
  },
});

module.exports = upload;

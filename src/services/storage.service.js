const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');

const originalsDir = path.join('uploads', 'originals');
const transformedDir = path.join('uploads', 'transformed');

fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(transformedDir, { recursive: true });

const getOriginalPath = (filename) => {
  return path.join(originalsDir, filename);
};

const getTransformedPath = (filename) => {
  return path.join(transformedDir, filename);
};

const getOriginalUrl = (filename) => {
  return `${env.baseUrl}/uploads/originals/${filename}`;
};

const getTransformedUrl = (filename) => {
  return `${env.baseUrl}/uploads/transformed/${filename}`;
};

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  originalsDir,
  transformedDir,
  getOriginalPath,
  getTransformedPath,
  getOriginalUrl,
  getTransformedUrl,
  deleteFileIfExists,
};

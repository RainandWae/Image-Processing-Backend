const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    format: {
      type: String,
    },
    isTransformed: {
      type: Boolean,
      default: false,
    },
    parentImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
    },
    transformations: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Image', imageSchema);
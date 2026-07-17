const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true,
    },
    resultImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
    },
    type: {
      type: String,
      enum: ['transform'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    transformations: {
      type: Object,
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({
  user: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model('Job', jobSchema);
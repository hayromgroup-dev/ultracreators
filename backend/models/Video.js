const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe o título do vídeo'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  folder: {
    type: String,
    default: 'Sem Pasta',
    trim: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  originalFilePath: {
    type: String,
    required: true
  },
  originalFileSize: {
    type: Number,
    required: true
  },
  hlsPath: {
    type: String,
    default: null
  },
  thumbnailPath: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  },
  resolution: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed'],
    default: 'uploading'
  },
  processingProgress: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  lessonId: {
    type: String,
    default: null
  },
  accessToken: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

videoSchema.index({ courseId: 1, lessonId: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ accessToken: 1 });
videoSchema.index({ folder: 1 });

module.exports = mongoose.model('Video', videoSchema);

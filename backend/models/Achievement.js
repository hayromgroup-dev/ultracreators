const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe o nome da conquista'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, informe a descrição da conquista'],
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  icon: {
    type: String,
    default: '🏆',
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  conditionType: {
    type: String,
    required: true,
    enum: [
      'first_lesson',
      'lessons_completed',
      'first_course',
      'course_completed',
      'specific_course',
      'streak_days',
      'watch_time',
      'welcome'
    ]
  },
  conditionValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

achievementSchema.index({ isActive: 1, order: 1 });
achievementSchema.index({ conditionType: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);

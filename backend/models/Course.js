const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe o título da aula'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    required: [true, 'Por favor, informe a URL da thumbnail da aula'],
    trim: true
  },
  videoIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  duration: {
    type: String,
    default: '00:00'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe o título do curso'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, informe a descrição do curso'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Marketing', 'Vendas', 'Tráfego', 'Copywriting', 'Design', 'Automação', 'Outro'],
    default: 'Outro'
  },
  lessons: [lessonSchema],
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
  }
}, {
  timestamps: true
});

courseSchema.virtual('totalDuration').get(function() {
  if (!this.lessons || this.lessons.length === 0) return '00:00';

  let totalSeconds = 0;
  this.lessons.forEach(lesson => {
    if (!lesson.duration) return;

    const durationStr = lesson.duration.toString().trim();
    const parts = durationStr.split(':');

    if (parts.length === 1) {
      totalSeconds += parseInt(parts[0]) || 0;
    } else if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      totalSeconds += (mins * 60) + secs;
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const mins = parseInt(parts[1]) || 0;
      const secs = parseInt(parts[2]) || 0;
      totalSeconds += (hours * 3600) + (mins * 60) + secs;
    }
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

courseSchema.virtual('lessonCount').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);

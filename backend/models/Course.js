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
  videoUrl: {
    type: String,
    required: [true, 'Por favor, informe a URL do vídeo'],
    trim: true
  },
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
  lessons: [lessonSchema], // Array of lesson objects
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

// Virtual for total duration
courseSchema.virtual('totalDuration').get(function() {
  if (!this.lessons || this.lessons.length === 0) return '00:00';

  let totalMinutes = 0;
  this.lessons.forEach(lesson => {
    const parts = lesson.duration.split(':');
    if (parts.length === 2) {
      totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      totalMinutes += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

// Virtual for lesson count
courseSchema.virtual('lessonCount').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);

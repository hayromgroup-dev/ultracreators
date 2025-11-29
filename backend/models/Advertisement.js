const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, informe o título do anúncio'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [300, 'Descrição não pode ter mais de 300 caracteres']
  },
  imageUrl: {
    type: String,
    required: [true, 'Por favor, informe a URL da imagem']
  },
  productLink: {
    type: String,
    required: [true, 'Por favor, informe o link do produto'],
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Comprar Agora'
  },
  placement: {
    type: String,
    enum: ['left', 'right'],
    default: 'right'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Advertisement', advertisementSchema);

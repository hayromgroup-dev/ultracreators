const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Mandatory fields
  nome: {
    type: String,
    required: [true, 'Por favor, informe seu nome'],
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  sobrenome: {
    type: String,
    required: [true, 'Por favor, informe seu sobrenome'],
    trim: true,
    maxlength: [50, 'Sobrenome não pode ter mais de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Por favor, informe seu email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Por favor, informe um email válido'
    ]
  },
  senha: {
    type: String,
    required: [true, 'Por favor, informe sua senha'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
    select: false // Don't return password by default
  },
  celular: {
    type: String,
    required: [true, 'Por favor, informe seu celular'],
    match: [
      /^(\+55\s?)?(\(?\d{2}\)?\s?)?(9?\d{4}-?\d{4})$/,
      'Por favor, informe um número de celular válido'
    ]
  },

  // Optional fields
  comOQueTrabalha: {
    type: String,
    enum: [
      'Administração',
      'Advocacia',
      'Arquitetura',
      'Artes',
      'Ciências',
      'Comércio',
      'Comunicação',
      'Construção Civil',
      'Contabilidade',
      'Design',
      'Educação',
      'Engenharia',
      'Entretenimento',
      'Estudante',
      'Gastronomia',
      'Gestão',
      'Indústria',
      'Marketing',
      'Medicina',
      'Saúde',
      'Serviços',
      'Tecnologia',
      'Turismo',
      'Desempregado(a)',
      'Autônomo(a)',
      'Empreendedor(a)',
      'Aposentado(a)',
      'Outro'
    ],
    default: null
  },
  estadoCivil: {
    type: String,
    enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Outro'],
    default: null
  },
  sexo: {
    type: String,
    enum: ['Masculino', 'Feminino', 'Não-binário', 'Prefiro não informar', 'Outro'],
    default: null
  },

  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  // Admin privileges
  isAdmin: {
    type: Boolean,
    default: false
  },

  // Course Progress Tracking
  courseProgress: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }],
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('senha')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.senha);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire time (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (1 hour)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);

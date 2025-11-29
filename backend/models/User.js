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

  // Optional fields - Registration Step 2
  comOQueTrabalha: {
    type: String,
    enum: [
      'Administracao',
      'Advocacia',
      'Arquitetura',
      'Artes',
      'Ciencias',
      'Comercio',
      'Comunicacao',
      'Construcao Civil',
      'Contabilidade',
      'Design',
      'Educacao',
      'Engenharia',
      'Entretenimento',
      'Estudante',
      'Gastronomia',
      'Gestao',
      'Industria',
      'Marketing',
      'Medicina',
      'Saude',
      'Servicos',
      'Tecnologia',
      'Turismo',
      'Desempregado(a)',
      'Autonomo(a)',
      'Empreendedor(a)',
      'Aposentado(a)',
      'Outro',
      null
    ],
    default: null
  },
  estadoCivil: {
    type: String,
    enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viuvo(a)', 'Uniao Estavel', 'Outro', null],
    default: null
  },
  sexo: {
    type: String,
    enum: ['Masculino', 'Feminino', 'Nao-binario', 'Prefiro nao informar', 'Outro', null],
    default: null
  },
  rendaMensal: {
    type: String,
    enum: ['Ate R$ 1.500', 'R$ 1.500 - R$ 3.000', 'R$ 3.000 - R$ 5.000', 'R$ 5.000 - R$ 10.000', 'R$ 10.000 - R$ 20.000', 'Acima de R$ 20.000', 'Prefiro nao informar', null],
    default: null
  },
  escolaridade: {
    type: String,
    enum: ['Ensino Fundamental', 'Ensino Medio', 'Ensino Superior Incompleto', 'Ensino Superior Completo', 'Pos-graduacao', 'Mestrado', 'Doutorado', null],
    default: null
  },
  tentouGanharDinheiroInternet: {
    type: String,
    enum: ['Sim, e tive sucesso', 'Sim, mas nao deu certo', 'Nao, mas tenho interesse', 'Nao, nunca tentei', null],
    default: null
  },
  idade: {
    type: Number,
    min: [13, 'Idade minima e 13 anos'],
    max: [120, 'Idade invalida'],
    default: null
  },
  // Registration Step 3
  desculpaGanharDinheiro: {
    type: String,
    trim: true,
    maxlength: [500, 'Resposta nao pode ter mais de 500 caracteres'],
    default: null
  },

  // Marketing & Profile fields
  dataNascimento: {
    type: Date,
    default: null
  },
  cidade: {
    type: String,
    trim: true,
    maxlength: [100, 'Cidade nao pode ter mais de 100 caracteres'],
    default: null
  },
  estado: {
    type: String,
    enum: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', null],
    default: null
  },
  comoConheceu: {
    type: String,
    enum: ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Google', 'Indicacao de amigo', 'Anuncio online', 'Outro', null],
    default: null
  },
  objetivoPrincipal: {
    type: String,
    enum: ['Ganhar dinheiro extra', 'Mudar de carreira', 'Aprender marketing digital', 'Criar negocio online', 'Crescer nas redes sociais', 'Virar influenciador', 'Outro', null],
    default: null
  },
  tempoDisponivel: {
    type: String,
    enum: ['Menos de 1 hora por dia', '1-2 horas por dia', '2-4 horas por dia', '4-6 horas por dia', 'Mais de 6 horas por dia', null],
    default: null
  },
  experienciaMarketing: {
    type: String,
    enum: ['Nenhuma', 'Iniciante', 'Intermediario', 'Avancado', null],
    default: null
  },
  instagram: {
    type: String,
    trim: true,
    maxlength: [100, 'Instagram nao pode ter mais de 100 caracteres'],
    default: null
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  profileCompletedAt: {
    type: Date,
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
  earnedAchievements: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streakData: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null }
  },

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

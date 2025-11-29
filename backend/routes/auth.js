const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const rateLimit = require('express-rate-limit');

// Rate limiters for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 5 minutos.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Muitos registros. Tente novamente em 1 hora.' }
});

const { protect, generateToken } = require('../middleware/auth');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../utils/emailService');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const {
      nome,
      sobrenome,
      email,
      senha,
      celular,
      // Step 2 fields
      comOQueTrabalha,
      rendaMensal,
      tentouGanharDinheiroInternet,
      escolaridade,
      sexo,
      idade,
      // Step 3 field
      desculpaGanharDinheiro
    } = req.body;

    // Validation - only require step 1 fields
    if (!nome || !email || !senha || !celular) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios'
      });
    }

    // Use sobrenome from request, or default if not provided
    const firstName = nome ? nome.trim() : '';
    const lastName = sobrenome ? sobrenome.trim() : 'Usuario';

    // Validate email domain
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe um email válido'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      if (!userExists.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está cadastrado mas não foi verificado. Verifique seu email ou solicite um novo código de verificação.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Validate password strength
    if (senha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Create user with all fields from multi-step form
    const user = await User.create({
      nome: firstName,
      sobrenome: lastName || 'Usuario',
      email: email.toLowerCase(),
      senha,
      celular,
      // Step 2 fields
      comOQueTrabalha: comOQueTrabalha || null,
      rendaMensal: rendaMensal || null,
      tentouGanharDinheiroInternet: tentouGanharDinheiroInternet || null,
      escolaridade: escolaridade || null,
      sexo: sexo || null,
      idade: idade ? parseInt(idade) : null,
      // Step 3 field
      desculpaGanharDinheiro: desculpaGanharDinheiro || null
    });

    // Assign welcome achievement to new user
    try {
      const welcomeAchievement = await Achievement.findOne({ conditionType: 'welcome', isActive: true });
      if (welcomeAchievement) {
        user.earnedAchievements = [{
          achievementId: welcomeAchievement._id,
          earnedAt: new Date()
        }];
        await user.save();
      }
    } catch (err) {
      console.error('Error assigning welcome achievement:', err);
    }

    // Auto-verify in development mode
    if (process.env.AUTO_VERIFY_EMAIL === 'true') {
      user.isEmailVerified = true;
      await user.save();

      // Generate JWT token
      const authToken = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso! Conta verificada automaticamente (modo desenvolvimento).',
        token: authToken,
        data: {
          id: user._id,
          nome: user.nome,
          sobrenome: user.sobrenome,
          email: user.email,
          celular: user.celular,
          comOQueTrabalha: user.comOQueTrabalha,
          rendaMensal: user.rendaMensal,
          tentouGanharDinheiroInternet: user.tentouGanharDinheiroInternet,
          escolaridade: user.escolaridade,
          sexo: user.sexo,
          idade: user.idade,
          desculpaGanharDinheiro: user.desculpaGanharDinheiro
        }
      });
    } else {
      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await sendVerificationEmail(user, verificationToken);
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso! Verifique seu email para ativar sua conta.',
        data: {
          userId: user._id,
          nome: user.nome,
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('Erro no registro:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Erro de validação'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao realizar cadastro. Tente novamente.'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação não fornecido'
      });
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido ou expirado'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
    }

    // Generate JWT token
    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verificado com sucesso!',
      token: authToken,
      data: {
        id: user._id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro na verificação de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar email. Tente novamente.'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu email'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Este email já foi verificado'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Email de verificação reenviado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reenviar email de verificação. Tente novamente.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validation
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe email e senha'
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+senha');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Por favor, verifique seu email antes de fazer login',
        needsVerification: true
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.'
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(senha);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      data: {
        id: user._id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        celular: user.celular,
        comOQueTrabalha: user.comOQueTrabalha,
        estadoCivil: user.estadoCivil,
        sexo: user.sexo,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login. Tente novamente.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        celular: user.celular,
        comOQueTrabalha: user.comOQueTrabalha,
        estadoCivil: user.estadoCivil,
        sexo: user.sexo,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu email'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Não existe conta com este email'
      });
    }

    // Protect master admin account
    if (user.email === 'admin@ultracreators.com') {
      return res.status(403).json({
        success: false,
        message: 'A senha do master admin não pode ser redefinida por este método. Entre em contato com o suporte.'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    // Send email
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Email de redefinição de senha enviado!'
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de redefinição. Tente novamente.'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Set new password
    user.senha = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new auth token
    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso!',
      token: authToken
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha. Tente novamente.'
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const {
      nome,
      sobrenome,
      celular,
      comOQueTrabalha,
      estadoCivil,
      sexo,
      rendaMensal,
      escolaridade,
      tentouGanharDinheiroInternet,
      idade,
      desculpaGanharDinheiro
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Update fields
    if (nome) user.nome = nome;
    if (sobrenome) user.sobrenome = sobrenome;
    if (celular) user.celular = celular;
    if (comOQueTrabalha !== undefined) user.comOQueTrabalha = comOQueTrabalha || null;
    if (estadoCivil !== undefined) user.estadoCivil = estadoCivil || null;
    if (sexo !== undefined) user.sexo = sexo || null;
    if (rendaMensal !== undefined) user.rendaMensal = rendaMensal || null;
    if (escolaridade !== undefined) user.escolaridade = escolaridade || null;
    if (tentouGanharDinheiroInternet !== undefined) user.tentouGanharDinheiroInternet = tentouGanharDinheiroInternet || null;
    if (idade !== undefined) user.idade = idade ? parseInt(idade) : null;
    if (desculpaGanharDinheiro !== undefined) user.desculpaGanharDinheiro = desculpaGanharDinheiro || null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: {
        id: user._id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        celular: user.celular,
        comOQueTrabalha: user.comOQueTrabalha,
        estadoCivil: user.estadoCivil,
        sexo: user.sexo,
        rendaMensal: user.rendaMensal,
        escolaridade: user.escolaridade,
        tentouGanharDinheiroInternet: user.tentouGanharDinheiroInternet,
        idade: user.idade,
        desculpaGanharDinheiro: user.desculpaGanharDinheiro
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil. Tente novamente.'
    });
  }
});



// @route   POST /api/auth/send-support-email
// @desc    Send support email from user
// @access  Private
router.post('/send-support-email', protect, async (req, res) => {
  try {
    const { subject, message, userEmail, userName } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Assunto e mensagem sao obrigatorios'
      });
    }

    const { sendSupportEmail } = require('../utils/emailService');

    await sendSupportEmail(
      userName || req.user.nome,
      userEmail || req.user.email,
      subject,
      message
    );

    res.status(200).json({
      success: true,
      message: 'Email enviado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao enviar email de suporte:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email. Tente novamente.'
    });
  }
});

module.exports = router;


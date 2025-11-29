const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Course = require('../models/Course');
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

// Apply protect and adminOnly middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// ========================================
// COURSES MANAGEMENT
// ========================================

// @route   GET /api/admin/courses
// @desc    Get all courses
// @access  Admin
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('createdBy', 'nome email').sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cursos'
    });
  }
});

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Admin
router.post('/courses', async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Curso criado com sucesso!',
      data: course
    });
  } catch (error) {
    console.error('Erro ao criar curso:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Erro de validação'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar curso'
    });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Admin
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Curso atualizado com sucesso!',
      data: course
    });
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar curso'
    });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Admin
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Curso deletado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar curso'
    });
  }
});

// ========================================
// LESSON MANAGEMENT (within courses)
// ========================================

// @route   POST /api/admin/courses/:id/lessons
// @desc    Add lesson to course
// @access  Admin
router.post('/courses/:id/lessons', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    course.lessons.push(req.body);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Aula adicionada com sucesso!',
      data: course
    });
  } catch (error) {
    console.error('Erro ao adicionar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar aula'
    });
  }
});

// @route   PUT /api/admin/courses/:id/lessons/:lessonId
// @desc    Update lesson in course
// @access  Admin
router.put('/courses/:id/lessons/:lessonId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Aula não encontrada'
      });
    }

    Object.assign(lesson, req.body);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Aula atualizada com sucesso!',
      data: course
    });
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar aula'
    });
  }
});

// @route   DELETE /api/admin/courses/:id/lessons/:lessonId
// @desc    Delete lesson from course
// @access  Admin
router.delete('/courses/:id/lessons/:lessonId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    course.lessons.pull(req.params.lessonId);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Aula deletada com sucesso!',
      data: course
    });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar aula'
    });
  }
});

// ========================================
// ADVERTISEMENTS MANAGEMENT
// ========================================

// @route   GET /api/admin/ads
// @desc    Get all advertisements
// @access  Admin
router.get('/ads', async (req, res) => {
  try {
    const ads = await Advertisement.find().populate('createdBy', 'nome email').sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar anúncios'
    });
  }
});

// @route   POST /api/admin/ads
// @desc    Create new advertisement
// @access  Admin
router.post('/ads', async (req, res) => {
  try {
    const adData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Check if there's already an ad with the same placement and order
    const existingAd = await Advertisement.findOne({
      placement: adData.placement,
      order: adData.order,
      isActive: true
    });

    if (existingAd) {
      const positionNames = { 0: 'Topo', 1: 'Meio', 2: 'Rodapé' };
      const positionName = positionNames[adData.order] || `posição ${adData.order}`;
      const sidebarName = adData.placement === 'left' ? 'esquerda' : 'direita';

      return res.status(400).json({
        success: false,
        message: `Já existe um anúncio ativo na posição "${positionName}" da barra lateral ${sidebarName}. Por favor, escolha outra posição.`
      });
    }

    const ad = await Advertisement.create(adData);

    res.status(201).json({
      success: true,
      message: 'Anúncio criado com sucesso!',
      data: ad
    });
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Erro de validação'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar anúncio'
    });
  }
});

// @route   PUT /api/admin/ads/:id
// @desc    Update advertisement
// @access  Admin
router.put('/ads/:id', async (req, res) => {
  try {
    // Check if there's already another ad with the same placement and order
    const existingAd = await Advertisement.findOne({
      _id: { $ne: req.params.id }, // Exclude the current ad being updated
      placement: req.body.placement,
      order: req.body.order,
      isActive: true
    });

    if (existingAd) {
      const positionNames = { 0: 'Topo', 1: 'Meio', 2: 'Rodapé' };
      const positionName = positionNames[req.body.order] || `posição ${req.body.order}`;
      const sidebarName = req.body.placement === 'left' ? 'esquerda' : 'direita';

      return res.status(400).json({
        success: false,
        message: `Já existe um anúncio ativo na posição "${positionName}" da barra lateral ${sidebarName}. Por favor, escolha outra posição.`
      });
    }

    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Anúncio não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Anúncio atualizado com sucesso!',
      data: ad
    });
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar anúncio'
    });
  }
});

// @route   DELETE /api/admin/ads/:id
// @desc    Delete advertisement
// @access  Admin
router.delete('/ads/:id', async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Anúncio não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Anúncio deletado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar anúncio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar anúncio'
    });
  }
});

// ========================================
// USERS MANAGEMENT
// ========================================

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .select('-senha')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      page: page,
      pages: Math.ceil(totalUsers / limit),
      data: users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (make admin, deactivate, etc.)
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Protect master admin account
    if (user.email === 'admin@ultracreators.com') {
      return res.status(403).json({
        success: false,
        message: 'A conta master admin não pode ser modificada'
      });
    }

    // Get requesting user for permission checks
    const requestingUser = await User.findById(req.user.id);
    const isMasterAdmin = requestingUser.email === 'admin@ultracreators.com';

    // Only master admin can remove admin permissions from other users
    if (req.body.isAdmin === false && user.isAdmin === true) {
      if (!isMasterAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Apenas o administrador master pode remover permissões de administrador'
        });
      }
    }

    // Only master admin can deactivate other admin accounts
    if (req.body.isActive === false && user.isAdmin === true) {
      if (!isMasterAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Apenas o administrador master pode desativar contas de administrador'
        });
      }
    }

    Object.assign(user, req.body);
    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-senha');

    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
      data: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Protect master admin account
    if (user.email === 'admin@ultracreators.com') {
      return res.status(403).json({
        success: false,
        message: 'A conta master admin não pode ser deletada'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Usuário deletado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar usuário'
    });
  }
});

// ========================================
// DASHBOARD STATS
// ========================================

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalAds = await Advertisement.countDocuments();
    const activeAds = await Advertisement.countDocuments({ isActive: true });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('nome email createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalAds,
        activeAds,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

// ========================================
// ACHIEVEMENTS MANAGEMENT
// ========================================

// @route   GET /api/admin/achievements
// @desc    Get all achievements
// @access  Admin
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate('createdBy', 'nome email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conquistas'
    });
  }
});

// @route   POST /api/admin/achievements
// @desc    Create new achievement
// @access  Admin
router.post('/achievements', async (req, res) => {
  try {
    const { name, description, icon, imageUrl, conditionType, conditionValue, order } = req.body;

    // Validate required fields
    if (!name || !description || !conditionType || conditionValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios'
      });
    }

    const achievement = await Achievement.create({
      name,
      description,
      icon: icon || '🏆',
      imageUrl,
      conditionType,
      conditionValue,
      order: order || 0,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Erro ao criar conquista:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conquista'
    });
  }
});

// @route   PATCH /api/admin/achievements/:id
// @desc    Update achievement
// @access  Admin
router.patch('/achievements/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Conquista não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Erro ao atualizar conquista:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar conquista'
    });
  }
});

// @route   DELETE /api/admin/achievements/:id
// @desc    Delete achievement
// @access  Admin
router.delete('/achievements/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Conquista não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conquista removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover conquista:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover conquista'
    });
  }
});

// ========================================
// VIDEO MANAGEMENT
// ========================================

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const Video = require('../models/Video');
const videoEncoder = require('../utils/videoEncoder');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../videos/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2000 * 1024 * 1024 }, // 2GB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm|flv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Apenas arquivos de vídeo são permitidos!'));
  }
});

// @route   POST /api/admin/videos/upload
// @desc    Upload video and start encoding
// @access  Admin
router.post('/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo de vídeo enviado'
      });
    }

    const { title, description, courseId, lessonId, folder } = req.body;

    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      folder: folder || 'Sem Pasta',
      originalFileName: req.file.originalname,
      originalFilePath: req.file.path,
      originalFileSize: req.file.size,
      courseId: courseId || null,
      lessonId: lessonId || null,
      uploadedBy: req.user.id,
      status: 'processing',
      accessToken: uuidv4()
    });

    processVideo(video._id, req.file.path).catch(err => {
      console.error('Background encoding error:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Upload iniciado! O vídeo será processado em breve.',
      data: video
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do vídeo'
    });
  }
});

async function processVideo(videoId, filePath) {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    const metadata = await videoEncoder.getMetadata(filePath);
    video.duration = Math.round(metadata.duration);
    video.resolution = metadata.resolution;
    await video.save();

    const thumbnailPath = await videoEncoder.generateThumbnail(filePath, videoId.toString());
    video.thumbnailPath = thumbnailPath;
    await video.save();

    const result = await videoEncoder.encodeToHLS(filePath, videoId.toString(), (progress) => {
      Video.findByIdAndUpdate(videoId, { processingProgress: progress }).catch(console.error);
    });

    video.hlsPath = result.hlsPath;
    video.status = 'ready';
    video.processingProgress = 100;
    await video.save();

    console.log('Video processed:', videoId);
  } catch (error) {
    console.error('Error processing video:', error);
    await Video.findByIdAndUpdate(videoId, {
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// @route   GET /api/admin/videos
// @desc    Get all videos
// @access  Admin
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('uploadedBy', 'nome email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vídeos'
    });
  }
});

// @route   GET /api/admin/videos/:id
// @desc    Get single video
// @access  Admin
router.get('/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploadedBy', 'nome email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vídeo não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vídeo'
    });
  }
});

// @route   DELETE /api/admin/videos/:id
// @desc    Delete video
// @access  Admin
router.delete('/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vídeo não encontrado'
      });
    }

    await videoEncoder.deleteVideo(video.hlsPath, video.thumbnailPath, video.originalFilePath);
    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vídeo excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir vídeo'
    });
  }
});


// @route   POST /api/admin/users/:id/send-reset-link
// @desc    Send password reset link to user (Admin only)
// @access  Private (Admin)
router.post('/users/:id/send-reset-link', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario nao encontrado'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    // Send email (will work once SendPulse is approved)
    try {
      const { sendPasswordResetEmail } = require('../utils/emailService');
      await sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Log but don't fail - email service might not be ready
      // Token logging removed for security
    }

    res.status(200).json({
      success: true,
      message: 'Link de redefinicao enviado para ' + user.email
    });
  } catch (error) {
    console.error('Erro ao enviar link de redefinicao:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar link de redefinicao'
    });
  }
});
module.exports = router;

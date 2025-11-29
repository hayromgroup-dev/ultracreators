const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { protect } = require('../middleware/auth');
const { checkAndAwardAchievements, calculateAchievementProgress } = require('../utils/achievementService');

// @route   GET /api/public/courses
// @desc    Get all active courses (public access)
// @access  Public
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('-createdBy')
      .sort({ order: 1, createdAt: -1 });

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

// @route   GET /api/public/courses/:id
// @desc    Get single course
// @access  Public
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select('-createdBy')
      .populate({
        path: 'lessons.videoIds',
        select: 'title description hlsPath thumbnailPath duration folder accessToken'
      });

    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar curso'
    });
  }
});

// @route   GET /api/public/ads
// @desc    Get all active advertisements
// @access  Public
router.get('/ads', async (req, res) => {
  try {
    const ads = await Advertisement.find({ isActive: true })
      .select('-createdBy')
      .sort({ placement: 1, order: 1, createdAt: -1 });

    // Increment view count
    await Advertisement.updateMany(
      { isActive: true },
      { $inc: { views: 1 } }
    );

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

// @route   POST /api/public/ads/:id/click
// @desc    Track ad click
// @access  Public
router.post('/ads/:id/click', async (req, res) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, {
      $inc: { clicks: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Click registrado'
    });
  } catch (error) {
    console.error('Erro ao registrar click:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar click'
    });
  }
});

// ========================================
// COURSE PROGRESS TRACKING
// ========================================

// @route   GET /api/public/user/progress
// @desc    Get user's progress for all courses
// @access  Private
router.get('/user/progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Return all course progress
    const progressData = user.courseProgress.map(cp => ({
      courseId: cp.courseId,
      completedLessons: cp.completedLessons,
      lastAccessedLesson: cp.lastAccessedLesson,
      lastAccessed: cp.lastAccessed,
      completedAt: cp.completedAt
    }));

    res.status(200).json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar progresso'
    });
  }
});

// @route   GET /api/public/courses/:courseId/progress
// @desc    Get user's progress for a specific course
// @access  Private
router.get('/courses/:courseId/progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const courseProgress = user.courseProgress.find(
      cp => cp.courseId.toString() === req.params.courseId
    );

    if (!courseProgress) {
      return res.status(200).json({
        success: true,
        data: {
          completedLessons: [],
          lastAccessedLesson: null,
          lastAccessed: null,
          completedAt: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        completedLessons: courseProgress.completedLessons,
        lastAccessedLesson: courseProgress.lastAccessedLesson,
        lastAccessed: courseProgress.lastAccessed,
        completedAt: courseProgress.completedAt
      }
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar progresso do curso'
    });
  }
});

// @route   POST /api/public/courses/:courseId/lessons/:lessonId/complete
// @desc    Mark a lesson as completed
// @access  Private
router.post('/courses/:courseId/lessons/:lessonId/complete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    // Check if lesson exists in course
    const lessonExists = course.lessons.id(req.params.lessonId);
    if (!lessonExists) {
      return res.status(404).json({
        success: false,
        message: 'Aula não encontrada'
      });
    }

    // Find or create course progress
    let courseProgress = user.courseProgress.find(
      cp => cp.courseId.toString() === req.params.courseId
    );

    if (!courseProgress) {
      user.courseProgress.push({
        courseId: req.params.courseId,
        completedLessons: [],
        lastAccessedLesson: req.params.lessonId,
        lastAccessed: Date.now()
      });
      courseProgress = user.courseProgress[user.courseProgress.length - 1];
    }

    // Add lesson to completed if not already there
    if (!courseProgress.completedLessons.includes(req.params.lessonId)) {
      courseProgress.completedLessons.push(req.params.lessonId);
    }

    // Update last accessed
    courseProgress.lastAccessedLesson = req.params.lessonId;
    courseProgress.lastAccessed = Date.now();

    // Check if all lessons are completed
    const totalLessons = course.lessons.length;
    const completedCount = courseProgress.completedLessons.length;

    if (completedCount === totalLessons && !courseProgress.completedAt) {
      courseProgress.completedAt = Date.now();
    }

    await user.save();

    // Check and award achievements
    const newAchievements = await checkAndAwardAchievements(
      user._id,
      'lesson_complete',
      {
        courseId: req.params.courseId,
        lessonId: req.params.lessonId
      }
    );

    res.status(200).json({
      success: true,
      message: 'Progresso atualizado com sucesso!',
      data: {
        completedLessons: courseProgress.completedLessons,
        totalLessons,
        completedCount,
        isCompleted: completedCount === totalLessons
      },
      newAchievements: newAchievements.map(a => ({
        id: a._id,
        name: a.name,
        description: a.description,
        icon: a.icon
      }))
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar progresso'
    });
  }
});

// @route   POST /api/public/courses/:courseId/lessons/:lessonId/access
// @desc    Track lesson access (for "continue watching")
// @access  Private
router.post('/courses/:courseId/lessons/:lessonId/access', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Find or create course progress
    let courseProgress = user.courseProgress.find(
      cp => cp.courseId.toString() === req.params.courseId
    );

    if (!courseProgress) {
      user.courseProgress.push({
        courseId: req.params.courseId,
        completedLessons: [],
        lastAccessedLesson: req.params.lessonId,
        lastAccessed: Date.now()
      });
    } else {
      courseProgress.lastAccessedLesson = req.params.lessonId;
      courseProgress.lastAccessed = Date.now();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Acesso registrado'
    });
  } catch (error) {
    console.error('Erro ao registrar acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar acesso'
    });
  }
});

// @route   GET /api/public/my-progress
// @desc    Get user's overall progress across all courses
// @access  Private
router.get('/my-progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'courseProgress.courseId',
      select: 'title thumbnail category'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Calculate progress for each course
    const progressData = await Promise.all(
      user.courseProgress.map(async (cp) => {
        const course = await Course.findById(cp.courseId);
        if (!course) return null;

        const totalLessons = course.lessons.length;
        const completedCount = cp.completedLessons.length;
        const progressPercentage = totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;

        return {
          course: {
            id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            category: course.category
          },
          completedLessons: completedCount,
          totalLessons,
          progressPercentage,
          lastAccessed: cp.lastAccessed,
          completedAt: cp.completedAt
        };
      })
    );

    // Filter out null values (deleted courses)
    const validProgress = progressData.filter(p => p !== null);

    res.status(200).json({
      success: true,
      data: validProgress
    });
  } catch (error) {
    console.error('Erro ao buscar progresso geral:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar progresso geral'
    });
  }
});

// ========================================
// ACHIEVEMENTS
// ========================================

// @route   GET /api/public/user/achievements
// @desc    Get user's achievements with progress
// @access  Private
router.get('/user/achievements', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('earnedAchievements.achievementId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Get all active achievements
    const allAchievements = await Achievement.find({ isActive: true }).sort({ order: 1 });

    // Get earned achievement IDs
    const earnedIds = (user.earnedAchievements || []).map(a => a.achievementId ? a.achievementId._id.toString() : '');

    // Build response with earned status and progress
    const achievementsWithProgress = await Promise.all(
      allAchievements.map(async (achievement) => {
        const earned = earnedIds.includes(achievement._id.toString());
        const earnedData = (user.earnedAchievements || []).find(a =>
          a.achievementId && a.achievementId._id && a.achievementId._id.toString() === achievement._id.toString()
        );

        let progress = null;
        if (!earned) {
          progress = await calculateAchievementProgress(user, achievement);
        }

        return {
          _id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          imageUrl: achievement.imageUrl,
          conditionType: achievement.conditionType,
          conditionValue: achievement.conditionValue,
          earned,
          earnedAt: earnedData ? earnedData.earnedAt : null,
          progress
        };
      })
    );

    res.status(200).json({
      success: true,
      data: achievementsWithProgress
    });
  } catch (error) {
    console.error('Erro ao buscar conquistas do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conquistas'
    });
  }
});

// @route   GET /api/public/achievements
// @desc    Get all active achievements (without user progress)
// @access  Public
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ order: 1 });

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

module.exports = router;

// @route   PUT /api/public/profile
// @desc    Update user profile with marketing data
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = [
      'nome', 'sobrenome', 'celular', 'sexo', 'estadoCivil', 'comOQueTrabalha', 'tentouGanharDinheiroInternet', 'idade', 'desculpaGanharDinheiro',
      'dataNascimento', 'cidade', 'estado', 'rendaMensal', 'escolaridade',
      'comoConheceu', 'objetivoPrincipal', 'tempoDisponivel', 'experienciaMarketing', 'instagram'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field] || null;
      }
    });

    // Check if profile is complete (has at least sexo, comOQueTrabalha, and objetivoPrincipal)
    const user = await User.findById(req.user.id);
    const mergedData = { ...user.toObject(), ...updateData };
    
    if (mergedData.sexo && mergedData.comOQueTrabalha && mergedData.objetivoPrincipal) {
      updateData.profileCompleted = true;
      if (!user.profileCompletedAt) {
        updateData.profileCompletedAt = new Date();
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-senha -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar perfil'
    });
  }
});

// @route   GET /api/public/profile
// @desc    Get user profile data
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-senha -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil'
    });
  }
});

// ============================================
// PRODUCT UPSELL ROUTES
// ============================================

const ProductUpsell = require('../models/ProductUpsell');

// @route   GET /api/public/product-upsell
// @desc    Get active product upsell for display
// @access  Public
router.get('/product-upsell', async (req, res) => {
  try {
    const upsell = await ProductUpsell.findOne({ isActive: true }).sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: upsell
    });
  } catch (error) {
    console.error('Erro ao buscar product upsell:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar product upsell'
    });
  }
});

// @route   GET /api/public/product-upsell/all
// @desc    Get all product upsells (admin)
// @access  Private (Admin)
router.get('/product-upsell/all', protect, async (req, res) => {
  try {
    const upsells = await ProductUpsell.find().sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: upsells
    });
  } catch (error) {
    console.error('Erro ao buscar product upsells:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar product upsells'
    });
  }
});

// @route   POST /api/public/product-upsell
// @desc    Create or update product upsell
// @access  Private (Admin)
router.post('/product-upsell', protect, async (req, res) => {
  try {
    const { customHtml, isActive } = req.body;
    
    // Deactivate all existing upsells
    await ProductUpsell.updateMany({}, { isActive: false });
    
    // Create new upsell
    const upsell = await ProductUpsell.create({
      customHtml,
      isActive: isActive !== false,
      updatedBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: upsell
    });
  } catch (error) {
    console.error('Erro ao salvar product upsell:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar product upsell'
    });
  }
});

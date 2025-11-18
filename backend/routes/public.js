const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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
    const course = await Course.findById(req.params.id).select('-createdBy');

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

    res.status(200).json({
      success: true,
      message: 'Progresso atualizado com sucesso!',
      data: {
        completedLessons: courseProgress.completedLessons,
        totalLessons,
        completedCount,
        isCompleted: completedCount === totalLessons
      }
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

module.exports = router;

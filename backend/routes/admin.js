const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Course = require('../models/Course');
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');

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
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-senha').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
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

module.exports = router;

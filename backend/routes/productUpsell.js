const express = require('express');
const router = express.Router();
const ProductUpsell = require('../models/ProductUpsell');
const { protect, adminOnly } = require('../middleware/auth');

// Get active product upsell (public)
router.get('/', async (req, res) => {
  try {
    const upsell = await ProductUpsell.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!upsell) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum upsell ativo encontrado'
      });
    }

    res.json({
      success: true,
      data: upsell
    });
  } catch (error) {
    console.error('Error fetching product upsell:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar upsell'
    });
  }
});

// Create or update product upsell (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { customHtml } = req.body;

    if (!customHtml) {
      return res.status(400).json({
        success: false,
        message: 'HTML personalizado é obrigatório'
      });
    }

    // Deactivate all previous upsells
    await ProductUpsell.updateMany({}, { isActive: false });

    // Create new upsell
    const upsell = await ProductUpsell.create({
      customHtml,
      isActive: true,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Upsell atualizado com sucesso',
      data: upsell
    });
  } catch (error) {
    console.error('Error creating product upsell:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar upsell'
    });
  }
});

// Get all upsells (admin only)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const upsells = await ProductUpsell.find().sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      data: upsells
    });
  } catch (error) {
    console.error('Error fetching upsells:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar upsells'
    });
  }
});

// Delete upsell (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    await ProductUpsell.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Upsell deletado com sucesso'
    });
  } catch (error) {
    console.error('Error deleting upsell:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar upsell'
    });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const productUpsellSchema = new mongoose.Schema({
  customHtml: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductUpsell', productUpsellSchema);

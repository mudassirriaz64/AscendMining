const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    dailyROI: {
      type: Number,
      required: [true, 'Daily ROI is required'],
      min: [0, 'Daily ROI must be positive'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    hashRate: {
      type: Number,
      default: 0,
      min: [0, 'Hash rate must be positive'],
    },
    coins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coin',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

packageSchema.index({ status: 1 });
packageSchema.index({ price: 1 });

module.exports = mongoose.model('Package', packageSchema);

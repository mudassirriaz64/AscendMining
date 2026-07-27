const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Coin name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Coin symbol is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    miningAvailable: {
      type: Boolean,
      default: true,
    },
    usdRate: {
      type: Number,
      required: [true, 'USD rate is required'],
      default: 1.0,
      min: [0.00000001, 'Rate must be positive'],
    },
    minWithdrawal: {
      type: Number,
      default: 1.0,
      min: [0, 'Min withdrawal must be positive'],
    },
    maxWithdrawal: {
      type: Number,
      default: 10.0,
      min: [0, 'Max withdrawal must be positive'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

coinSchema.index({ isActive: 1 });

module.exports = mongoose.model('Coin', coinSchema);

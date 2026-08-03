const mongoose = require('mongoose');

const walletChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coinSymbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    currentWalletAddress: {
      type: String,
      default: null,
      trim: true,
    },
    requestedWalletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for pending-lock check
walletChangeRequestSchema.index({ userId: 1, coinSymbol: 1, status: 1 });
walletChangeRequestSchema.index({ status: 1 });
walletChangeRequestSchema.index({ userId: 1 });

module.exports = mongoose.model('WalletChangeRequest', walletChangeRequestSchema);

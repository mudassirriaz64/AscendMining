const mongoose = require('mongoose');

const userPackageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    purchaseAmount: { type: Number, required: true },
    dailyROISnapshot: { type: Number, required: true },
    durationSnapshot: { type: Number, required: true },
    status: { type: String, enum: ['pending_deposit', 'active', 'completed', 'cancelled'], default: 'pending_deposit' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isMining: { type: Boolean, default: false },
    cycleStartedAt: { type: Date, default: null },
    cycleEndsAt: { type: Date, default: null },
    lastPayoutAt: { type: Date, default: null },
    nextMiningAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationPenalty: { type: Number, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true }
);

userPackageSchema.index({ userId: 1 });
userPackageSchema.index({ status: 1, cycleEndsAt: 1 });
userPackageSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('UserPackage', userPackageSchema);

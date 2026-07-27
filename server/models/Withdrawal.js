const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinSymbol: { type: String, required: true },
    amount: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    rejectionReason: { type: String, default: null },
    heldAmount: { type: Number, default: 0 },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ userId: 1, requestedAt: 1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);

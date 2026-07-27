const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    qualifyingUserPackageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    bonus: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'qualified', 'blocked'], default: 'pending' },
    blockedReason: { type: String, default: null },
    qualifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1 });
referralSchema.index({ status: 1 });

module.exports = mongoose.model('Referral', referralSchema);

const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'deposit_approved',
        'deposit_rejected',
        'withdrawal_approved',
        'withdrawal_rejected',
        'user_suspended',
        'user_reactivated',
        'password_reset_triggered',
        'package_created',
        'package_updated',
        'package_cancelled',
        'package_deleted',
        'wallet_adjustment',
        'referral_blocked',
        'cms_content_updated',
        'coin_created',
        'coin_updated',
        'coin_deleted',
        'faq_created',
        'faq_updated',
        'faq_deleted',
        'service_created',
        'service_updated',
        'service_deleted',
        'kyc_approved',
        'kyc_rejected',
      ],
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

adminLogSchema.index({ actorId: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);

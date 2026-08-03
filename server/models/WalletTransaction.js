const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'deposit',
        'withdrawal',
        'mining_payout',
        'package_purchase',
        'cancellation_refund',
        'admin_adjustment',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['Deposit', 'Withdrawal', 'UserPackage', 'AdminLog'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    coinSymbol: {
      type: String,
      default: 'USD',
    },
    reason: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

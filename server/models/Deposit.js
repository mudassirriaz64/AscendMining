const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage', default: null },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
    amount: { type: Number, required: true },
    screenshot: { type: String, default: null },
    screenshotHash: { type: String, default: null },
    transactionReference: { type: String, default: null },
    senderHolderName: { type: String, default: null },
    senderPhone: { type: String, default: null },
    senderBankName: { type: String, default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

depositSchema.index({ userId: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ screenshotHash: 1 });

module.exports = mongoose.model('Deposit', depositSchema);

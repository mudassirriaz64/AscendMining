const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['bank', 'crypto_manual', 'crypto_api'], required: true },
    instructions: { type: String, default: '' },
    minDeposit: { type: Number, required: true },
    maxDeposit: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ status: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

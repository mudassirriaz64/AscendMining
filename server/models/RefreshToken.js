const mongoose = require('mongoose');
const { JWT_REFRESH_EXPIRY_MS } = require('../config/constants');
const bcrypt = require('bcrypt');

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

refreshTokenSchema.pre('save', async function () {
  if (!this.isModified('tokenHash')) return;
  this.tokenHash = await bcrypt.hash(this.tokenHash, 10);
});

refreshTokenSchema.methods.compareToken = async function (candidateToken) {
  return bcrypt.compare(candidateToken, this.tokenHash);
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

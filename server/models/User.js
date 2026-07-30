const mongoose = require('mongoose');
const { BCRYPT_ROUNDS } = require('../config/constants');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['investor', 'admin', 'support_agent'],
      default: 'investor',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'unverified'],
      default: 'unverified',
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    miningBalances: {
      type: Map,
      of: Number,
      default: {},
    },
    walletAddresses: {
      type: Map,
      of: String,
      default: {},
    },
    referralBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      immutable: true,
    },
    kycStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    kycDocumentType: {
      type: String,
      enum: ['cnic', 'driver_license', 'passport'],
      default: null,
    },
    kycDocumentUrl: {
      type: String,
      default: null,
    },
    kycPersonalInfo: {
      fullName: { type: String, default: null },
      dateOfBirth: { type: String, default: null },
      documentNumber: { type: String, default: null },
      address: { type: String, default: null },
      city: { type: String, default: null },
    },
    kycRejectionReason: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetOTPHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ referredBy: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

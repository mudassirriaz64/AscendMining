const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');
const { PASSWORD_RESET_EXPIRY_MINUTES } = require('../config/constants');
const Admin = require('../models/Admin');
const Referral = require('../models/Referral');

// No cookie setup functions are needed for sessionStorage auth

const register = async ({ fullName, username, email, password, country, phone, referralCode }) => {
  const emailExists = await userRepository.existsByEmail(email);
  if (emailExists) {
    throw new AppError('EMAIL_EXISTS', 'This email is already registered.', 409);
  }

  const usernameExists = await userRepository.existsByUsername(username);
  if (usernameExists) {
    throw new AppError('USERNAME_EXISTS', 'This username is already taken.', 409);
  }

  let referredBy = null;
  if (referralCode) {
    const referrer = await userRepository.findByReferralCode(referralCode);
    if (referrer) {
      referredBy = referrer._id;
    }
  }

  const user = await userRepository.create({
    fullName,
    username,
    email: email.toLowerCase(),
    passwordHash: password,
    country: country || null,
    phone: phone || null,
    referralCode: uuidv4().slice(0, 8).toUpperCase(),
    referredBy,
  });

  if (referredBy) {
    await Referral.create({
      referrer: referredBy,
      referredUser: user._id,
      status: 'pending',
    });
  }

  const accessToken = generateAccessToken(user);
  const { token: refreshTokenHash, rawToken } = generateRefreshToken();
  await refreshTokenRepository.create(refreshTokenHash, user._id);

  return {
    user,
    accessToken,
    refreshToken: rawToken,
  };
};

const login = async ({ emailOrUsername, password }) => {
  const isEmail = emailOrUsername.includes('@');
  const user = isEmail
    ? await userRepository.findByEmailWithPassword(emailOrUsername)
    : await userRepository.findByUsernameWithPassword(emailOrUsername);

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email/username or password.', 401);
  }

  if (user.status === 'suspended') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account has been suspended. Contact support.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email/username or password.', 401);
  }

  const accessToken = generateAccessToken(user);
  const { token: refreshTokenHash, rawToken } = generateRefreshToken();
  await refreshTokenRepository.create(refreshTokenHash, user._id);

  return { user, accessToken, refreshToken: rawToken };
};

const adminLogin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!admin) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  if (admin.status === 'suspended') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account has been suspended. Contact support.', 403);
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = generateAccessToken({ _id: admin._id, role: admin.role });
  const { token: refreshTokenHash, rawToken } = generateRefreshToken();
  await refreshTokenRepository.create(refreshTokenHash, admin._id);

  return { admin, accessToken, refreshToken: rawToken };
};

const refreshAccessToken = async (rawRefreshToken) => {
  const tokens = await require('../models/RefreshToken').find({ revoked: false });

  let matchedToken = null;
  for (const doc of tokens) {
    const isMatch = await doc.compareToken(rawRefreshToken);
    if (isMatch) {
      matchedToken = doc;
      break;
    }
  }

  if (!matchedToken) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.', 401);
  }

  await refreshTokenRepository.revoke(matchedToken.tokenHash);

  let entity = null;
  let role = null;

  const user = await userRepository.findById(matchedToken.userId);
  if (user) {
    entity = user;
    role = user.role;
  } else {
    const admin = await Admin.findById(matchedToken.userId);
    if (admin) {
      entity = admin;
      role = 'admin';
    }
  }

  if (!entity) {
    throw new AppError('USER_NOT_FOUND', 'User not found.', 401);
  }

  const accessToken = generateAccessToken({ _id: entity._id, role });
  const { token: newRefreshHash, rawToken: newRawToken } = generateRefreshToken();
  await refreshTokenRepository.create(newRefreshHash, entity._id);

  return { user: entity.toJSON(), accessToken, refreshToken: newRawToken };
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (user) return user;

  const admin = await Admin.findById(userId);
  if (admin) return admin;

  throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
};

const logout = async () => {
  // Session storage is cleared client-side, no-op here
};

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  await userRepository.updateById(user._id, {
    passwordResetToken: resetTokenHash,
    passwordResetExpires: resetExpires,
  });

  return { message: 'If an account with that email exists, a reset link has been sent.', resetToken };
};

const resetPassword = async ({ token, password }) => {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await require('../models/User').findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired reset token.', 400);
  }

  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await refreshTokenRepository.revokeAllForUser(user._id);

  return { message: 'Password has been reset successfully.' };
};

const checkAvailability = async ({ email, username }) => {
  const result = {
    emailAvailable: true,
    usernameAvailable: true,
  };

  if (email) {
    result.emailAvailable = !(await userRepository.existsByEmail(email));
  }
  if (username) {
    result.usernameAvailable = !(await userRepository.existsByUsername(username));
  }

  return result;
};

const updateProfile = async (userId, data) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (data.fullName !== undefined) user.fullName = data.fullName;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.country !== undefined) user.country = data.country;
  
  await user.save();
  return user;
};

const updatePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId, '+passwordHash');
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('INVALID_CREDENTIALS', 'Incorrect current password.', 401);

  user.passwordHash = newPassword;
  await user.save();
  return user;
};

module.exports = {
  register,
  login,
  adminLogin,
  refreshAccessToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  checkAvailability,
  updateProfile,
  updatePassword,
};

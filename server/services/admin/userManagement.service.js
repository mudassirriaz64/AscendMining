const userRepository = require('../../repositories/user.repository');
const adminLogRepository = require('../../repositories/adminLog.repository');
const walletTransactionRepository = require('../../repositories/walletTransaction.repository');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');

const listUsers = async ({ search, status, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    userRepository.findByFilter(filter, { skip, limit, sort: { createdAt: -1 } }),
    userRepository.countByFilter(filter),
  ]);
  return { users, total, page, limit };
};

const getUserDetail = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
  return user;
};

const getUserPackages = async (userId, { page = 1, limit = 20 }) => {
  const UserPackage = require('../../models/UserPackage');
  const skip = (page - 1) * limit;
  const [packages, total] = await Promise.all([
    UserPackage.find({ userId })
      .populate('packageId', 'name price dailyROI duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserPackage.countDocuments({ userId }),
  ]);
  return { packages, total, page, limit };
};

const getUserDeposits = async (userId, { page = 1, limit = 20, status }) => {
  const Deposit = require('../../models/Deposit');
  const filter = { userId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [deposits, total] = await Promise.all([
    Deposit.find(filter)
      .populate('paymentMethod', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Deposit.countDocuments(filter),
  ]);
  return { deposits, total, page, limit };
};

const getUserWithdrawals = async (userId, { page = 1, limit = 20, status }) => {
  const Withdrawal = require('../../models/Withdrawal');
  const filter = { userId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Withdrawal.countDocuments(filter),
  ]);
  return { withdrawals, total, page, limit };
};

const getUserReferrals = async (userId, { page = 1, limit = 20 }) => {
  const Referral = require('../../models/Referral');
  const skip = (page - 1) * limit;
  const [referrals, total] = await Promise.all([
    Referral.find({ referrer: userId })
      .populate('referredUser', 'username email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Referral.countDocuments({ referrer: userId }),
  ]);
  return { referrals, total, page, limit };
};

const getUserScreenshots = async (userId, { page = 1, limit = 20 }) => {
  const Deposit = require('../../models/Deposit');
  const skip = (page - 1) * limit;
  const [deposits, total] = await Promise.all([
    Deposit.find({ userId, screenshot: { $exists: true, $ne: null } })
      .select('screenshot createdAt amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Deposit.countDocuments({ userId, screenshot: { $exists: true, $ne: null } }),
  ]);
  return { screenshots: deposits, total, page, limit };
};

const suspendUser = async (userId, adminId, reason, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
  if (user.status === 'suspended') throw new AppError('ALREADY_SUSPENDED', 'User is already suspended.', 409);
  if (user.role === 'admin') throw new AppError('CANNOT_SUSPEND_ADMIN', 'Cannot suspend an admin user.', 403);

  const beforeState = { status: user.status };
  await userRepository.updateById(userId, { status: 'suspended' });
  const afterState = { status: 'suspended' };

  await adminLogRepository.create({
    actorId: adminId,
    action: 'user_suspended',
    targetType: 'User',
    targetId: userId,
    beforeState,
    afterState,
    reason,
    ipAddress: ip,
  });

  return { message: 'User suspended successfully.' };
};

const reactivateUser = async (userId, adminId, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
  if (user.status !== 'suspended') throw new AppError('NOT_SUSPENDED', 'User is not suspended.', 409);

  const beforeState = { status: user.status };
  await userRepository.updateById(userId, { status: 'active' });
  const afterState = { status: 'active' };

  await adminLogRepository.create({
    actorId: adminId,
    action: 'user_reactivated',
    targetType: 'User',
    targetId: userId,
    beforeState,
    afterState,
    ipAddress: ip,
  });

  return { message: 'User reactivated successfully.' };
};

const triggerPasswordReset = async (userId, adminId, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'password_reset_triggered',
    targetType: 'User',
    targetId: userId,
    beforeState: null,
    afterState: null,
    reason: 'Admin-triggered password reset',
    ipAddress: ip,
  });

  return { message: 'Password reset email sent to user.' };
};

const adjustUserBalance = async (userId, { type, amount, reason }, adminId, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Amount must be a positive number.', 400);
  }

  if (!['add', 'deduct'].includes(type)) {
    throw new AppError('INVALID_TYPE', 'Type must be "add" or "deduct".', 400);
  }

  const beforeBalance = user.walletBalance;
  let adjustAmount = parsedAmount;
  if (type === 'deduct') {
    if (beforeBalance < parsedAmount) {
      throw new AppError('INSUFFICIENT_BALANCE', 'User balance is insufficient for deduction.', 400);
    }
    adjustAmount = -parsedAmount;
  }

  const afterBalance = beforeBalance + adjustAmount;
  
  // Update user
  await userRepository.updateById(userId, { walletBalance: afterBalance });

// Create Wallet Transaction
  const WalletTransaction = require('../../models/WalletTransaction');
  await WalletTransaction.create({
    userId,
    currency: 'USD',
    type: type === 'add' ? 'deposit' : 'withdrawal',
    amount: adjustAmount,
    referenceType: 'AdminLog',
    referenceId: new mongoose.Types.ObjectId(adminId),
    balanceAfter: afterBalance,
    description: reason || `Admin balance adjustment: ${type}`,
    createdBy: adminId,
  });

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'wallet_adjustment',
    targetType: 'User',
    targetId: userId,
    beforeState: { walletBalance: beforeBalance },
    afterState: { walletBalance: afterBalance },
    reason: reason || `Admin adjusted balance by ${adjustAmount}`,
    ipAddress: ip,
  });

  return { message: 'Balance adjusted successfully.', walletBalance: afterBalance };
};

module.exports = {
  listUsers,
  getUserDetail,
  getUserPackages,
  getUserDeposits,
  getUserWithdrawals,
  getUserReferrals,
  getUserScreenshots,
  suspendUser,
  reactivateUser,
  triggerPasswordReset,
  adjustUserBalance,
};

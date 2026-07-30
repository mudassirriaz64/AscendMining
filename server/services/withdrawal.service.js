const withdrawalRepository = require('../repositories/withdrawal.repository');
const userRepository = require('../repositories/user.repository');
const adminLogRepository = require('../repositories/adminLog.repository');
const Coin = require('../models/Coin');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const requestWithdrawal = async (userId, { coinSymbol, amount }) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new AppError('INVALID_INPUT', 'Please provide a valid amount.', 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (user.kycStatus !== 'approved') {
    throw new AppError('KYC_REQUIRED', 'Please complete your KYC verification first to withdraw funds.', 403);
  }

  // 1. Validate the coin exists and is active
  const coin = await Coin.findOne({ symbol: coinSymbol, isActive: true });
  if (!coin) {
    throw new AppError('COIN_NOT_SUPPORTED', `The coin ${coinSymbol} is not currently supported or active for withdrawals.`, 400);
  }

  // 2. Validate amount is within limits
  if (parsedAmount < coin.minWithdrawal || parsedAmount > coin.maxWithdrawal) {
    throw new AppError('LIMIT_VIOLATION', `Withdrawal amount must be between ${coin.minWithdrawal} ${coinSymbol} and ${coin.maxWithdrawal} ${coinSymbol}.`, 400);
  }

  // 3. Validate user has wallet address set
  if (!user.walletAddresses) {
    user.walletAddresses = new Map();
  }
  const walletAddress = user.walletAddresses.get(coinSymbol);
  if (!walletAddress || !walletAddress.trim()) {
    throw new AppError('ADDRESS_NOT_CONFIGURED', `Please configure your ${coinSymbol} wallet address in account settings first.`, 400);
  }

  // 4. Validate sufficient balance
  if (!user.miningBalances) {
    user.miningBalances = new Map();
  }
  const balance = user.miningBalances.get(coinSymbol) || 0;
  if (balance < parsedAmount) {
    throw new AppError('INSUFFICIENT_BALANCE', `Insufficient ${coinSymbol} balance. Available: ${balance.toFixed(8)} ${coinSymbol}.`, 400);
  }

  // 5. Deduct balance and save
  user.miningBalances.set(coinSymbol, balance - parsedAmount);
  await user.save();

  // 6. Create Pending Withdrawal log
  const withdrawal = await withdrawalRepository.create({
    userId,
    coinSymbol,
    amount: parsedAmount,
    walletAddress,
    status: 'pending',
  });

  return { withdrawal, user };
};

const listWithdrawals = async (userId) => {
  return withdrawalRepository.findAll({ userId }, { sort: { createdAt: -1 } });
};

const getPendingWithdrawals = async ({ page = 1, limit = 20 }) => {
  const filter = { status: 'pending' };
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [withdrawals, total] = await Promise.all([
    withdrawalRepository.findAll(filter, {
      populate: ['userId'],
      sort: { requestedAt: 1 }, // oldest first
      skip,
      limit: parseInt(limit, 10),
    }),
    withdrawalRepository.countByFilter(filter),
  ]);
  return { withdrawals, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

const getAllWithdrawals = async ({ page = 1, limit = 20, status }) => {
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [withdrawals, total] = await Promise.all([
    withdrawalRepository.findAll(filter, {
      populate: ['userId'],
      sort: { requestedAt: -1 },
      skip,
      limit: parseInt(limit, 10),
    }),
    withdrawalRepository.countByFilter(filter),
  ]);
  return { withdrawals, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

const approveWithdrawal = async (id, adminId, ip) => {
  const withdrawal = await withdrawalRepository.findById(id);
  if (!withdrawal) throw new AppError('WITHDRAWAL_NOT_FOUND', 'Withdrawal request not found.', 404);
  if (withdrawal.status !== 'pending') throw new AppError('WITHDRAWAL_ALREADY_PROCESSED', 'Withdrawal is not pending.', 400);

  const user = await userRepository.findById(withdrawal.userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  // Approve status
  withdrawal.status = 'completed';
  withdrawal.approvedBy = adminId;
  withdrawal.approvedAt = new Date();
  withdrawal.completedAt = new Date();
  await withdrawal.save();

  // Create withdrawal transaction
  const tx = await WalletTransaction.create({
    userId: user._id,
    type: 'withdrawal',
    amount: -withdrawal.amount,
    coinSymbol: withdrawal.coinSymbol,
    referenceType: 'Withdrawal',
    referenceId: withdrawal._id,
    balanceAfter: user.miningBalances.get(withdrawal.coinSymbol) || 0,
    reason: `Completed withdrawal of ${withdrawal.amount} ${withdrawal.coinSymbol}`,
  });

  // Notify user
  await Notification.create({
    userId: user._id,
    title: 'Withdrawal Approved & Sent',
    message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.coinSymbol} has been processed and sent to your configured address.`,
    type: 'success',
    link: '/withdraw',
  });

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'withdrawal_approved',
    targetId: user._id,
    targetType: 'User',
    beforeState: { status: 'pending' },
    afterState: { status: 'completed' },
    details: { withdrawalId: withdrawal._id, amount: withdrawal.amount, coin: withdrawal.coinSymbol },
    ipAddress: ip,
  });

  return { withdrawal, tx };
};

const rejectWithdrawal = async (id, rejectionReason, adminId, ip) => {
  const withdrawal = await withdrawalRepository.findById(id);
  if (!withdrawal) throw new AppError('WITHDRAWAL_NOT_FOUND', 'Withdrawal request not found.', 404);
  if (withdrawal.status !== 'pending') throw new AppError('WITHDRAWAL_ALREADY_PROCESSED', 'Withdrawal is not pending.', 400);

  const user = await userRepository.findById(withdrawal.userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  // Reject status
  withdrawal.status = 'rejected';
  withdrawal.rejectionReason = rejectionReason;
  await withdrawal.save();

  // Refund the user's balance
  if (!user.miningBalances) user.miningBalances = new Map();
  const currentBalance = user.miningBalances.get(withdrawal.coinSymbol) || 0;
  user.miningBalances.set(withdrawal.coinSymbol, currentBalance + withdrawal.amount);
  await user.save();

  // Create refund transaction log
  const tx = await WalletTransaction.create({
    userId: user._id,
    type: 'withdrawal_refund',
    amount: withdrawal.amount,
    coinSymbol: withdrawal.coinSymbol,
    referenceType: 'Withdrawal',
    referenceId: withdrawal._id,
    balanceAfter: currentBalance + withdrawal.amount,
    reason: `Refund for rejected withdrawal: ${rejectionReason}`,
  });

  // Notify user
  await Notification.create({
    userId: user._id,
    title: 'Withdrawal Rejected (Refunded)',
    message: `Your withdrawal request of ${withdrawal.amount} ${withdrawal.coinSymbol} was rejected. Reason: ${rejectionReason}. Funds refunded.`,
    type: 'error',
    link: '/withdraw',
  });

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'withdrawal_rejected',
    targetId: user._id,
    targetType: 'User',
    beforeState: { status: 'pending' },
    afterState: { status: 'rejected', rejectionReason },
    details: { withdrawalId: withdrawal._id, amount: withdrawal.amount, coin: withdrawal.coinSymbol, reason: rejectionReason },
    ipAddress: ip,
  });

  return { withdrawal, tx, user };
};

module.exports = {
  requestWithdrawal,
  listWithdrawals,
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
};

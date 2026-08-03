const walletChangeRequestRepository = require('../repositories/walletChangeRequest.repository');
const userRepository = require('../repositories/user.repository');
const adminLogRepository = require('../repositories/adminLog.repository');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

/**
 * Submit a wallet address change request for a specific coin.
 * Enforces the one-pending-per-coin-per-user lock.
 */
const submitRequest = async (userId, { coinSymbol, requestedWalletAddress }) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  const normalizedSymbol = coinSymbol.trim().toUpperCase();
  const normalizedAddress = requestedWalletAddress.trim();

  // Enforce pending lock: only one pending request per coin per user
  const existing = await walletChangeRequestRepository.findPendingByUserAndCoin(userId, normalizedSymbol);
  if (existing) {
    throw new AppError(
      'PENDING_REQUEST_EXISTS',
      `You already have a pending wallet address change request for ${normalizedSymbol}. Please wait for it to be reviewed.`,
      409
    );
  }

  // Read current address (if any) for audit trail
  const currentWalletAddress = user.walletAddresses?.get(normalizedSymbol) || null;

  // Prevent submitting the same address as current
  if (currentWalletAddress && currentWalletAddress === normalizedAddress) {
    throw new AppError(
      'ADDRESS_UNCHANGED',
      `The requested address is identical to your current ${normalizedSymbol} wallet address.`,
      400
    );
  }

  const request = await walletChangeRequestRepository.create({
    userId,
    coinSymbol: normalizedSymbol,
    currentWalletAddress,
    requestedWalletAddress: normalizedAddress,
    status: 'pending',
  });

  return request;
};

/**
 * Fetch all wallet change requests for a specific user (newest first).
 */
const getMyRequests = async (userId) => {
  const requests = await walletChangeRequestRepository.findAll(
    { userId },
    { sort: { createdAt: -1 } }
  );
  return requests;
};

/**
 * Admin: Approve a wallet change request.
 * Applies the new address to User.walletAddresses.
 */
const approveRequest = async (requestId, adminId, ip) => {
  const request = await walletChangeRequestRepository.findById(requestId);
  if (!request) throw new AppError('REQUEST_NOT_FOUND', 'Wallet change request not found.', 404);
  if (request.status !== 'pending') {
    throw new AppError('REQUEST_ALREADY_PROCESSED', 'This request has already been processed.', 400);
  }

  const user = await userRepository.findById(request.userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  // Approve and timestamp
  request.status = 'approved';
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  // Apply the new wallet address
  if (!user.walletAddresses) user.walletAddresses = new Map();
  user.walletAddresses.set(request.coinSymbol, request.requestedWalletAddress);
  await user.save();

  // Notify user
  await Notification.create({
    userId: user._id,
    title: 'Wallet Address Updated',
    message: `Your request to change your ${request.coinSymbol} wallet address has been approved. Your new payout address is now active.`,
    type: 'success',
    link: '/wallets',
  });

  // Admin audit log
  await adminLogRepository.create({
    actorId: adminId,
    action: 'wallet_change_approved',
    targetId: user._id,
    targetType: 'User',
    beforeState: { coinSymbol: request.coinSymbol, walletAddress: request.currentWalletAddress },
    afterState: { coinSymbol: request.coinSymbol, walletAddress: request.requestedWalletAddress },
    ipAddress: ip,
  });

  return { request, user };
};

/**
 * Admin: Reject a wallet change request with a reason.
 */
const rejectRequest = async (requestId, rejectionReason, adminId, ip) => {
  const request = await walletChangeRequestRepository.findById(requestId);
  if (!request) throw new AppError('REQUEST_NOT_FOUND', 'Wallet change request not found.', 404);
  if (request.status !== 'pending') {
    throw new AppError('REQUEST_ALREADY_PROCESSED', 'This request has already been processed.', 400);
  }

  // Reject with reason
  request.status = 'rejected';
  request.rejectionReason = rejectionReason;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  // Notify user
  await Notification.create({
    userId: request.userId,
    title: 'Wallet Address Change Rejected',
    message: `Your request to change your ${request.coinSymbol} wallet address was rejected. Reason: ${rejectionReason}`,
    type: 'error',
    link: '/wallets',
  });

  // Admin audit log
  await adminLogRepository.create({
    actorId: adminId,
    action: 'wallet_change_rejected',
    targetId: request.userId,
    targetType: 'User',
    beforeState: { coinSymbol: request.coinSymbol, requestedAddress: request.requestedWalletAddress },
    afterState: { status: 'rejected', rejectionReason },
    ipAddress: ip,
  });

  return { request };
};

/**
 * Admin: Get all wallet change requests with optional status filter and pagination.
 */
const getRequests = async ({ page = 1, limit = 20, status } = {}) => {
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [requests, total] = await Promise.all([
    walletChangeRequestRepository.findAll(filter, {
      populate: [{ path: 'userId', select: 'username email fullName' }],
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit, 10),
    }),
    walletChangeRequestRepository.countByFilter(filter),
  ]);

  return { requests, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

module.exports = {
  submitRequest,
  getMyRequests,
  approveRequest,
  rejectRequest,
  getRequests,
};

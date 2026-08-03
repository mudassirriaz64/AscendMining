const walletChangeRequestService = require('../../services/walletChangeRequest.service');
const { emitWalletChangeStatus } = require('../../utils/dashboardEvents');

/**
 * GET /api/admin/wallet-requests
 * GET /api/admin/wallet-requests/pending
 * List all wallet change requests with optional status filter and pagination.
 */
const getRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const result = await walletChangeRequestService.getRequests({ page, limit, status });

    res.status(200).json({
      success: true,
      data: {
        requests: result.requests,
        pagination: {
          total: result.total,
          page: result.page,
          pages: Math.ceil(result.total / result.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/wallet-requests/:id/approve
 * Approve a wallet change request — applies new address to user's profile.
 */
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ip = req.ip;

    const { request } = await walletChangeRequestService.approveRequest(id, adminId, ip);

    // Real-time update to user and admin broadcast
    emitWalletChangeStatus(req.app, request.userId, {
      _id: request._id,
      coinSymbol: request.coinSymbol,
      status: 'approved',
      requestedWalletAddress: request.requestedWalletAddress,
    });

    res.status(200).json({
      success: true,
      message: 'Wallet address change request approved. User\'s address has been updated.',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/wallet-requests/:id/reject
 * Reject a wallet change request with a required reason.
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;
    const ip = req.ip;

    const { request } = await walletChangeRequestService.rejectRequest(id, rejectionReason, adminId, ip);

    // Real-time update to user
    emitWalletChangeStatus(req.app, request.userId, {
      _id: request._id,
      coinSymbol: request.coinSymbol,
      status: 'rejected',
      rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: 'Wallet address change request rejected.',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRequests,
  approveRequest,
  rejectRequest,
};

const walletChangeRequestService = require('../services/walletChangeRequest.service');
const { emitWalletChangeNew } = require('../utils/dashboardEvents');

/**
 * POST /api/wallets/request-change
 * User submits a wallet address change request (requires admin approval).
 */
const submitWalletChangeRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { coinSymbol, requestedWalletAddress } = req.body;

    const request = await walletChangeRequestService.submitRequest(userId, {
      coinSymbol,
      requestedWalletAddress,
    });

    // Notify admins of new pending request for badge refresh
    emitWalletChangeNew(req.app, {
      requestId: request._id,
      userId,
      coinSymbol: request.coinSymbol,
    });

    res.status(201).json({
      success: true,
      message: `Your ${request.coinSymbol} wallet address change request has been submitted and is pending admin review.`,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wallets/change-requests
 * Fetch all wallet change requests for the authenticated user.
 */
const getMyWalletChangeRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const requests = await walletChangeRequestService.getMyRequests(userId);

    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitWalletChangeRequest,
  getMyWalletChangeRequests,
};

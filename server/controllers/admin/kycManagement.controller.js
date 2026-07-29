const kycService = require('../../services/kyc.service');

exports.getPendingKYC = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await kycService.getPendingKYC({ page, limit });

    res.status(200).json({
      success: true,
      data: {
        requests: result.requests,
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.approveKYC = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    const ip = req.ip;

    const user = await kycService.approveKYC(userId, adminId, ip);

    res.status(200).json({
      success: true,
      message: 'KYC verified and approved successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectKYC = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    const ip = req.ip;

    const user = await kycService.rejectKYC(userId, reason, adminId, ip);

    res.status(200).json({
      success: true,
      message: 'KYC submission rejected successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const kycService = require('../services/kyc.service');
const userRepository = require('../repositories/user.repository');
const { emitUserStatusChange } = require('../utils/dashboardEvents');

const submitKYC = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await kycService.submitKYC(userId, req.body);

    // Emit real-time status change to notify admins
    emitUserStatusChange(req.app, userId, { kycStatus: 'pending', status: user.status });

    res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully. Verification pending review.',
      data: {
        kycStatus: user.kycStatus,
        kycDocumentType: user.kycDocumentType,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getKYCStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userRepository.findById(userId);
    
    res.status(200).json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        kycDocumentType: user.kycDocumentType,
        kycRejectionReason: user.kycRejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
};

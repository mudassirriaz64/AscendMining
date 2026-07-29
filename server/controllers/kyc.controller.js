const User = require('../models/User');

const submitKYC = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentType, documentImage } = req.body;

    if (!documentType || !documentImage) {
      return res.status(400).json({
        success: false,
        error: { message: 'Document type and document image are required.' }
      });
    }

    if (!['cnic', 'driver_license', 'passport'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid document type. Allowed CNIC, Driver License, Passport.' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.' }
      });
    }

    if (user.kycStatus === 'approved') {
      return res.status(400).json({
        success: false,
        error: { message: 'Your KYC has already been approved.' }
      });
    }

    user.kycStatus = 'pending';
    user.kycDocumentType = documentType;
    user.kycDocumentUrl = documentImage;
    user.kycRejectionReason = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully. Verification pending review.',
      data: {
        kycStatus: user.kycStatus,
        kycDocumentType: user.kycDocumentType,
      }
    });
  } catch (error) {
    next(error);
  }
};

const getKYCStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId, 'kycStatus kycDocumentType kycRejectionReason');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
};

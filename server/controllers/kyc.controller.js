const User = require('../models/User');

const submitKYC = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentType, documentImage, fullName, dateOfBirth, documentNumber, address, city } = req.body;

    if (!documentType || !documentImage) {
      return res.status(400).json({
        success: false,
        error: { message: 'Document type and document image are required.' }
      });
    }

    if (!fullName || !dateOfBirth || !documentNumber) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full name, date of birth, and document number are required.' }
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

    // Upload KYC image to Cloudinary
    let kycUrl = documentImage;
    if (documentImage && documentImage.startsWith('data:image/')) {
      try {
        const cloudinary = require('../config/cloudinary');
        const uploadResult = await cloudinary.uploader.upload(documentImage, {
          folder: `ascend-mining/users/${userId}/kyc`,
          resource_type: 'image',
        });
        kycUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to upload verification documents to Cloudinary. Please try again.' }
        });
      }
    }

    user.kycStatus = 'pending';
    user.kycDocumentType = documentType;
    user.kycDocumentUrl = kycUrl;
    user.kycPersonalInfo = { fullName, dateOfBirth, documentNumber, address: address || null, city: city || null };
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

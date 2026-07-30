const kycRepository = require('../repositories/kyc.repository');
const userRepository = require('../repositories/user.repository');
const adminLogRepository = require('../repositories/adminLog.repository');
const cloudinary = require('../config/cloudinary');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const referralService = require('./referral.service');

// Helper to upload a buffer/base64 to Cloudinary
const uploadKycToCloudinary = (imageStr, userId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      imageStr,
      {
        folder: `ascendhash/users/${userId}/kyc`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

const submitKYC = async (userId, { documentType, documentImage, fullName, dateOfBirth, documentNumber, address, city }) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (user.kycStatus === 'approved') {
    throw new AppError('KYC_ALREADY_APPROVED', 'Your KYC has already been approved.', 400);
  }

  // 1. Upload verification documents following conventions
  let kycUrl = documentImage;
  if (documentImage && documentImage.startsWith('data:image/')) {
    try {
      const uploadResult = await uploadKycToCloudinary(documentImage, userId);
      kycUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('[Cloudinary] KYC upload error:', uploadError);
      throw new AppError('UPLOAD_FAILED', 'Failed to upload verification documents to Cloudinary. Please try again.', 500);
    }
  }

  // 2. Update User document with KYC details and pending state
  const updatedUser = await kycRepository.updateKycStatus(userId, {
    kycStatus: 'pending',
    kycDocumentType: documentType,
    kycDocumentUrl: kycUrl,
    kycRejectionReason: null,
    kycPersonalInfo: {
      fullName,
      dateOfBirth,
      documentNumber,
      address: address || null,
      city: city || null,
    },
  });

  return updatedUser;
};

const getPendingKYC = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    kycRepository.findPending({
      sort: { updatedAt: 1 }, // oldest first
      skip,
      limit,
    }),
    kycRepository.countPending(),
  ]);

  return { requests, total, page, limit };
};

const approveKYC = async (userId, adminId, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (user.kycStatus !== 'pending') {
    throw new AppError('KYC_NOT_PENDING', 'This KYC submission is not pending review.', 400);
  }

  const beforeState = { kycStatus: user.kycStatus, status: user.status };

  // Update Mongoose user document status
  user.kycStatus = 'approved';
  if (user.status === 'unverified') {
    user.status = 'active'; // Activate user
  }
  user.kycRejectionReason = null;
  await user.save();

  // Process any pending referral rewards that this user qualified for
  await referralService.checkAndReleaseReferralRewards(userId);

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'kyc_approved',
    targetId: userId,
    targetType: 'User',
    beforeState,
    afterState: { kycStatus: 'approved', status: user.status },
    ipAddress: ip,
  });

  // Notify user
  await Notification.create({
    userId,
    title: 'KYC Verified Successfully',
    message: 'Congratulations! Your identity documents have been verified. Withdrawals are now unlocked.',
    type: 'success',
    link: '/withdraw',
  });

  return user;
};

const rejectKYC = async (userId, reason, adminId, ip) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  if (user.kycStatus !== 'pending') {
    throw new AppError('KYC_NOT_PENDING', 'This KYC submission is not pending review.', 400);
  }

  const beforeState = { kycStatus: user.kycStatus, kycRejectionReason: user.kycRejectionReason };

  user.kycStatus = 'rejected';
  user.kycRejectionReason = reason;
  await user.save();

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'kyc_rejected',
    targetId: userId,
    targetType: 'User',
    beforeState,
    afterState: { kycStatus: 'rejected', kycRejectionReason: reason },
    ipAddress: ip,
  });

  // Notify user
  await Notification.create({
    userId,
    title: 'KYC Verification Rejected',
    message: `Your identity verification failed. Reason: ${reason}. Please re-submit your documents.`,
    type: 'error',
    link: '/kyc',
  });

  return user;
};

module.exports = {
  submitKYC,
  getPendingKYC,
  approveKYC,
  rejectKYC,
};

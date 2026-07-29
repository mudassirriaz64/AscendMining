const User = require('../../models/User');
const Notification = require('../../models/Notification');
const AdminLog = require('../../models/AdminLog');

exports.getPendingKYC = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { kycStatus: 'pending' };
    const [requests, total] = await Promise.all([
      User.find(query, 'username email fullName kycStatus kycDocumentType kycDocumentUrl updatedAt')
        .sort({ updatedAt: 1 }) // oldest pending first
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
        total,
        page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveKYC = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.' }
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'This KYC submission is not pending review.' }
      });
    }

    const beforeState = { kycStatus: user.kycStatus, status: user.status };

    user.kycStatus = 'approved';
    if (user.status === 'unverified') {
      user.status = 'active'; // Activate user
    }
    user.kycRejectionReason = null;
    await user.save();

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'kyc_approved',
      targetId: userId,
      targetType: 'User',
      beforeState,
      afterState: { kycStatus: 'approved', status: user.status },
      ipAddress: req.ip
    });

    // Notify user
    await Notification.create({
      userId,
      title: 'KYC Verified Successfully',
      message: 'Congratulations! Your identity documents have been verified. Withdrawals are now unlocked.',
      type: 'kyc_approved',
      link: '/withdraw'
    });

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

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'A rejection reason is required.' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.' }
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'This KYC submission is not pending review.' }
      });
    }

    const beforeState = { kycStatus: user.kycStatus, kycRejectionReason: user.kycRejectionReason };

    user.kycStatus = 'rejected';
    user.kycRejectionReason = reason;
    await user.save();

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'kyc_rejected',
      targetId: userId,
      targetType: 'User',
      beforeState,
      afterState: { kycStatus: 'rejected', kycRejectionReason: reason },
      ipAddress: req.ip
    });

    // Notify user
    await Notification.create({
      userId,
      title: 'KYC Verification Rejected',
      message: `Your identity verification failed. Reason: ${reason}. Please re-submit your documents.`,
      type: 'kyc_rejected',
      link: '/kyc'
    });

    res.status(200).json({
      success: true,
      message: 'KYC submission rejected successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

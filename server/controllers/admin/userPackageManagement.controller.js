const UserPackage = require('../../models/UserPackage');
const AdminLog = require('../../models/AdminLog');

exports.getUserPackages = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) {
      filter.userId = userId;
    }

    const packages = await UserPackage.find(filter)
      .populate('userId', 'username email fullName')
      .populate({
        path: 'packageId',
        populate: { path: 'coins', model: 'Coin' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dailyROISnapshot, durationSnapshot, status, nextMiningAt, isMining } = req.body;
    const adminId = req.user.id;

    const userPackage = await UserPackage.findById(id);
    if (!userPackage) {
      return res.status(404).json({
        success: false,
        error: { message: 'User package not found.' }
      });
    }

    const updates = {};
    const oldValues = {};

    if (dailyROISnapshot !== undefined) {
      const parsedROI = parseFloat(dailyROISnapshot);
      if (!isNaN(parsedROI) && parsedROI >= 0) {
        oldValues.dailyROISnapshot = userPackage.dailyROISnapshot;
        userPackage.dailyROISnapshot = parsedROI;
        updates.dailyROISnapshot = parsedROI;
      }
    }

    if (durationSnapshot !== undefined) {
      const parsedDuration = parseInt(durationSnapshot);
      if (!isNaN(parsedDuration) && parsedDuration >= 1) {
        oldValues.durationSnapshot = userPackage.durationSnapshot;
        userPackage.durationSnapshot = parsedDuration;
        updates.durationSnapshot = parsedDuration;
      }
    }

    if (status !== undefined) {
      oldValues.status = userPackage.status;
      userPackage.status = status;
      updates.status = status;
    }

    if (isMining !== undefined) {
      oldValues.isMining = userPackage.isMining;
      userPackage.isMining = !!isMining;
      updates.isMining = !!isMining;
    }

    if (nextMiningAt !== undefined) {
      oldValues.nextMiningAt = userPackage.nextMiningAt;
      userPackage.nextMiningAt = nextMiningAt ? new Date(nextMiningAt) : null;
      updates.nextMiningAt = userPackage.nextMiningAt;
    }

    await userPackage.save();

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'user_package_updated',
      targetId: userPackage.userId,
      targetType: 'User',
      details: {
        userPackageId: userPackage._id,
        updates,
        oldValues
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User package updated successfully.',
      data: userPackage,
    });
  } catch (error) {
    next(error);
  }
};

const Deposit = require('../../models/Deposit');
const UserPackage = require('../../models/UserPackage');
const WalletTransaction = require('../../models/WalletTransaction');
const AdminLog = require('../../models/AdminLog');
const User = require('../../models/User');

const getPendingDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const [deposits, total] = await Promise.all([
      Deposit.find(filter)
        .populate('userId', 'fullName username email')
        .populate('packageId')
        .populate('paymentMethod')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Deposit.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        deposits,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

const approveDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ success: false, error: { message: 'Deposit not found', status: 404 } });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Deposit is not pending', status: 400 } });
    }

    const user = await User.findById(deposit.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found', status: 404 } });
    }

    // Process approval
    deposit.status = 'approved';
    deposit.approvedBy = adminId;
    deposit.approvedAt = new Date();
    await deposit.save();

    let walletBalanceAfter = user.walletBalance + deposit.amount;

    // Create deposit transaction
    await WalletTransaction.create({
      userId: user._id,
      currency: 'USD',
      type: 'deposit',
      amount: deposit.amount,
      referenceType: 'Deposit',
      referenceId: deposit._id,
      balanceAfter: walletBalanceAfter
    });

    if (deposit.packageId) {
      const userPackage = await UserPackage.findById(deposit.packageId);
      if (userPackage) {
        userPackage.status = 'active';
        userPackage.startDate = new Date();
        userPackage.isMining = true;
        // The package cycle starts now
        userPackage.cycleStartedAt = new Date();
        userPackage.nextMiningAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // next ROI after 24h
        
        // Compute cycle ends at based on duration
        const cycleEnds = new Date();
        cycleEnds.setDate(cycleEnds.getDate() + userPackage.durationSnapshot);
        userPackage.cycleEndsAt = cycleEnds;
        
        await userPackage.save();

        // Offset the balance back
        walletBalanceAfter -= deposit.amount;

        // Create package purchase transaction
        await WalletTransaction.create({
          userId: user._id,
          currency: 'USD',
          type: 'package_purchase',
          amount: -deposit.amount,
          referenceType: 'UserPackage',
          referenceId: userPackage._id,
          balanceAfter: walletBalanceAfter
        });
      }
    } else {
      // Actually update the user's wallet balance if there is no package associated
      user.walletBalance = walletBalanceAfter;
      await user.save();
    }

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'deposit_approved',
      targetId: user._id,
      targetType: 'User',
      details: { depositId: deposit._id, amount: deposit.amount, packageId: deposit.packageId },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully',
      data: deposit
    });
  } catch (error) {
    next(error);
  }
};

const rejectDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: { message: 'Rejection reason is required', status: 400 } });
    }

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ success: false, error: { message: 'Deposit not found', status: 404 } });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Deposit is not pending', status: 400 } });
    }

    deposit.status = 'rejected';
    deposit.rejectionReason = rejectionReason;
    await deposit.save();

    if (deposit.packageId) {
      const userPackage = await UserPackage.findById(deposit.packageId);
      if (userPackage) {
        userPackage.status = 'cancelled';
        userPackage.cancellationReason = rejectionReason;
        userPackage.cancelledAt = new Date();
        await userPackage.save();
      }
    }

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'deposit_rejected',
      targetId: deposit.userId,
      targetType: 'User',
      details: { depositId: deposit._id, amount: deposit.amount, reason: rejectionReason },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Deposit rejected successfully',
      data: deposit
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingDeposits,
  approveDeposit,
  rejectDeposit
};

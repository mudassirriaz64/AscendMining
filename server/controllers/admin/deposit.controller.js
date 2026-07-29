const Deposit = require('../../models/Deposit');
const WalletTransaction = require('../../models/WalletTransaction');
const AdminLog = require('../../models/AdminLog');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { emitDepositStatusChange, emitBalanceUpdate, emitTransactionUpdate } = require('../../utils/dashboardEvents');

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

    // Process approval - ONLY credit wallet balance (no package activation per Option B)
    deposit.status = 'approved';
    deposit.approvedBy = adminId;
    deposit.approvedAt = new Date();
    await deposit.save();

    // Credit user's wallet balance
    const newWalletBalance = user.walletBalance + deposit.amount;
    user.walletBalance = newWalletBalance;
    await user.save();

    // Create deposit transaction
    await WalletTransaction.create({
      userId: user._id,
      currency: 'USD',
      type: 'deposit',
      amount: deposit.amount,
      referenceType: 'Deposit',
      referenceId: deposit._id,
      balanceAfter: newWalletBalance
    });

    // Send Notification
    await Notification.create({
      userId: user._id,
      title: 'Deposit Approved',
      message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved and added to your wallet balance.`,
      type: 'success',
      link: '/deposits'
    });

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'deposit_approved',
      targetId: user._id,
      targetType: 'User',
      details: { depositId: deposit._id, amount: deposit.amount },
      ipAddress: req.ip
    });

    // Emit real-time deposit status change
    emitDepositStatusChange(req.app, user._id, {
      _id: deposit._id,
      status: 'approved',
      amount: deposit.amount,
      approvedAt: deposit.approvedAt,
    });
    emitBalanceUpdate(req.app, user._id, { walletBalance: newWalletBalance });
    emitTransactionUpdate(req.app, user._id, {
      _id: deposit._id,
      type: 'deposit',
      amount: deposit.amount,
      currency: 'USD',
      balanceAfter: newWalletBalance,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully. Wallet balance credited.',
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

    // Send Notification
    await Notification.create({
      userId: deposit.userId,
      title: 'Deposit Rejected',
      message: `Your deposit of $${deposit.amount.toFixed(2)} was rejected. Reason: ${rejectionReason}`,
      type: 'error',
      link: '/deposits'
    });

    // Log admin action
    await AdminLog.create({
      actorId: adminId,
      action: 'deposit_rejected',
      targetId: deposit.userId,
      targetType: 'User',
      details: { depositId: deposit._id, amount: deposit.amount, reason: rejectionReason },
      ipAddress: req.ip
    });

    // Emit real-time deposit status change
    emitDepositStatusChange(req.app, deposit.userId, {
      _id: deposit._id,
      status: 'rejected',
      amount: deposit.amount,
      rejectionReason,
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

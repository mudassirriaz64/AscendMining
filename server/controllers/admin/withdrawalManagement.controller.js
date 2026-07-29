const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const AdminLog = require('../../models/AdminLog');
const WalletTransaction = require('../../models/WalletTransaction');
const Notification = require('../../models/Notification');
const { emitWithdrawalStatusChange, emitAdminUpdate, emitMiningUpdate } = require('../../utils/dashboardEvents');

const getPendingWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'username email fullName')
      .sort({ requestedAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Withdrawal.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // allow filtering by status
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'username email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Withdrawal.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const approveWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const withdrawal = await Withdrawal.findById(id).populate('userId', 'username email');
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: { message: 'Withdrawal not found' } });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: `Withdrawal is already ${withdrawal.status}` } });
    }

    withdrawal.status = 'approved';
    withdrawal.approvedAt = new Date();
    withdrawal.approvedBy = adminId;
    await withdrawal.save();

    await AdminLog.create({
      actorId: adminId,
      action: 'withdrawal_approved',
      targetId: withdrawal.userId._id,
      targetType: 'User',
      details: { withdrawalId: withdrawal._id, amount: withdrawal.amount, coin: withdrawal.coinSymbol },
      ipAddress: req.ip
    });

    await Notification.create({
      userId: withdrawal.userId._id,
      title: 'Withdrawal Approved',
      message: `Your withdrawal of ${withdrawal.amount.toFixed(4)} ${withdrawal.coinSymbol} has been approved and sent to your wallet.`,
      type: 'success',
      link: '/withdraw/history'
    });

    // Emit real-time withdrawal status change
    emitWithdrawalStatusChange(req.app, withdrawal.userId._id, {
      _id: withdrawal._id,
      status: 'approved',
      amount: withdrawal.amount,
      coinSymbol: withdrawal.coinSymbol,
    });
    emitAdminUpdate(req.app, 'admin:withdrawal:approved', {
      _id: withdrawal._id,
      userId: withdrawal.userId._id,
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal approved successfully.',
      data: { withdrawal },
    });
  } catch (error) {
    next(error);
  }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ success: false, error: { message: 'Rejection reason is required' } });
    }

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: { message: 'Withdrawal not found' } });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: `Withdrawal is already ${withdrawal.status}` } });
    }

    // Refund the user's balance
    const user = await User.findById(withdrawal.userId);
    if (user) {
      if (!user.miningBalances) user.miningBalances = new Map();
      const currentBal = user.miningBalances.get(withdrawal.coinSymbol) || 0;
      user.miningBalances.set(withdrawal.coinSymbol, currentBal + withdrawal.amount);
      await user.save();

      emitMiningUpdate(req.app, withdrawal.userId, {
        miningStatus: { hashRate: 0 },
      });
      
      // Log the refund transaction
      await WalletTransaction.create({
        userId: user._id,
        type: 'withdrawal_refund',
        amount: withdrawal.amount,
        coinSymbol: withdrawal.coinSymbol,
        referenceType: 'Withdrawal',
        referenceId: withdrawal._id,
        description: `Refund for rejected withdrawal: ${reason}`
      });
    }

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    await withdrawal.save();

    await AdminLog.create({
      actorId: adminId,
      action: 'withdrawal_rejected',
      targetId: withdrawal.userId,
      targetType: 'User',
      details: { withdrawalId: withdrawal._id, amount: withdrawal.amount, reason },
      ipAddress: req.ip
    });

    await Notification.create({
      userId: withdrawal.userId,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal of ${withdrawal.amount.toFixed(4)} ${withdrawal.coinSymbol} was rejected and refunded. Reason: ${reason}`,
      type: 'error',
      link: '/withdraw/history'
    });

    // Emit real-time withdrawal status change
    emitWithdrawalStatusChange(req.app, withdrawal.userId, {
      _id: withdrawal._id,
      status: 'rejected',
      amount: withdrawal.amount,
      coinSymbol: withdrawal.coinSymbol,
      rejectionReason: reason,
    });
    emitAdminUpdate(req.app, 'admin:withdrawal:rejected', {
      _id: withdrawal._id,
      userId: withdrawal.userId,
      status: 'rejected',
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal rejected and amount refunded to user.',
      data: { withdrawal },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
};

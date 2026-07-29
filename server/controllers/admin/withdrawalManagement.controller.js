const withdrawalService = require('../../services/withdrawal.service');
const { emitWithdrawalStatusChange, emitAdminUpdate, emitMiningUpdate } = require('../../utils/dashboardEvents');

const getPendingWithdrawals = async (req, res, next) => {
  try {
    const result = await withdrawalService.getPendingWithdrawals(req.query);
    res.status(200).json({
      success: true,
      data: {
        withdrawals: result.withdrawals,
        pagination: {
          total: result.total,
          page: result.page,
          pages: Math.ceil(result.total / result.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await withdrawalService.getAllWithdrawals({ page, limit, status });
    res.status(200).json({
      success: true,
      data: {
        withdrawals: result.withdrawals,
        pagination: {
          total: result.total,
          page: result.page,
          pages: Math.ceil(result.total / result.limit),
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
    const ip = req.ip;

    const { withdrawal } = await withdrawalService.approveWithdrawal(id, adminId, ip);

    // Emit real-time withdrawal status change
    emitWithdrawalStatusChange(req.app, withdrawal.userId, {
      _id: withdrawal._id,
      status: 'completed',
      amount: withdrawal.amount,
      coinSymbol: withdrawal.coinSymbol,
    });
    emitAdminUpdate(req.app, 'admin:withdrawal:approved', {
      _id: withdrawal._id,
      userId: withdrawal.userId,
      status: 'completed',
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
    const { rejectionReason } = req.body;
    const adminId = req.user.id;
    const ip = req.ip;

    const { withdrawal } = await withdrawalService.rejectWithdrawal(id, rejectionReason, adminId, ip);

    emitMiningUpdate(req.app, withdrawal.userId, {
      miningStatus: { hashRate: 0 },
    });

    // Emit real-time withdrawal status change
    emitWithdrawalStatusChange(req.app, withdrawal.userId, {
      _id: withdrawal._id,
      status: 'rejected',
      amount: withdrawal.amount,
      coinSymbol: withdrawal.coinSymbol,
      rejectionReason,
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

const withdrawalService = require('../services/withdrawal.service');
const { emitWithdrawalUpdate, emitAdminUpdate, emitMiningUpdate } = require('../utils/dashboardEvents');

const requestWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const withdrawal = await withdrawalService.requestWithdrawal(userId, req.body);

    // Emit real-time events for new withdrawal
    emitMiningUpdate(req.app, userId, {
      miningStatus: { hashRate: 0 },
    });
    emitWithdrawalUpdate(req.app, userId, {
      _id: withdrawal._id,
      coinSymbol: withdrawal.coinSymbol,
      amount: withdrawal.amount,
      status: 'pending',
      walletAddress: withdrawal.walletAddress,
      createdAt: withdrawal.createdAt,
    });
    emitAdminUpdate(req.app, 'admin:withdrawal:new', {
      _id: withdrawal._id,
      userId,
      coinSymbol: withdrawal.coinSymbol,
      amount: withdrawal.amount,
      status: 'pending',
      walletAddress: withdrawal.walletAddress,
      createdAt: withdrawal.createdAt,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully and is pending admin approval.',
      data: {
        withdrawal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listWithdrawals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const withdrawals = await withdrawalService.listWithdrawals(userId);

    res.status(200).json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestWithdrawal,
  listWithdrawals,
};

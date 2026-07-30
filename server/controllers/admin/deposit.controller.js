const depositService = require('../../services/deposit.service');
const { emitDepositStatusChange, emitBalanceUpdate, emitTransactionUpdate } = require('../../utils/dashboardEvents');

const getPendingDeposits = async (req, res, next) => {
  try {
    const result = await depositService.getPendingDeposits(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const approveDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ip = req.ip;

    const { deposit, newWalletBalance, tx } = await depositService.approveDeposit(id, adminId, ip);

    // Emit real-time deposit status change
    emitDepositStatusChange(req.app, deposit.userId, {
      _id: deposit._id,
      status: 'approved',
      amount: deposit.amount,
      approvedAt: deposit.approvedAt,
    });
    emitBalanceUpdate(req.app, deposit.userId, { walletBalance: newWalletBalance });
    emitTransactionUpdate(req.app, deposit.userId, tx.toJSON());

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully. Wallet balance credited.',
      data: deposit,
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
    const ip = req.ip;

    const deposit = await depositService.rejectDeposit(id, rejectionReason, adminId, ip);

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
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingDeposits,
  approveDeposit,
  rejectDeposit,
};

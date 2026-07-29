const User = require('../../models/User');
const UserPackage = require('../../models/UserPackage');
const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'investor' });
    const activeUsers = await User.countDocuments({ role: 'investor', status: 'active' });
    const activePackages = await UserPackage.countDocuments({ status: 'active' });
    const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });

    const depositsAgg = await Deposit.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalDeposits = depositsAgg.length > 0 ? depositsAgg[0].totalAmount : 0;

    const withdrawalsAgg = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = withdrawalsAgg.length > 0 ? withdrawalsAgg[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          activePackages,
          pendingDeposits,
          totalDeposits,
          totalWithdrawals,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};

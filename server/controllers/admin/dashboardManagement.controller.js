const User = require('../../models/User');
const UserPackage = require('../../models/UserPackage');
const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const AdminLog = require('../../models/AdminLog');
const SystemSetting = require('../../models/SystemSetting');

const getPendingCounts = async (req, res, next) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = (value, fallback) => {
      const ts = Number(value);
      return Number.isFinite(ts) && ts > 0 ? new Date(ts) : fallback;
    };
    const usersSince = toDate(req.query.lastSeenUsers, dayAgo);
    const logsSince = toDate(req.query.lastSeenAuditLogs, dayAgo);

    const [newUsers, pendingKYCs, pendingDeposits, pendingWithdrawals, recentLogs] = await Promise.all([
      User.countDocuments({ role: 'investor', createdAt: { $gt: usersSince } }),
      User.countDocuments({ role: 'investor', kycStatus: 'pending' }),
      Deposit.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      AdminLog.countDocuments({ createdAt: { $gt: logsSince } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: newUsers,
        kyc: pendingKYCs,
        deposits: pendingDeposits,
        withdrawals: pendingWithdrawals,
        auditLogs: recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLast30Days = () => {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'investor' });
    const activeUsers = await User.countDocuments({ role: 'investor', status: 'active' });
    const activePackages = await UserPackage.countDocuments({ status: 'active' });
    
    // Pending approvals sum up pending deposits, pending withdrawals, and pending KYCs
    const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const pendingKYCs = await User.countDocuments({ role: 'investor', kycStatus: 'pending' });
    const pendingApprovals = pendingDeposits + pendingWithdrawals + pendingKYCs;

    // Platform liquidity = sum of all active user balances
    const liquidityAgg = await User.aggregate([
      { $match: { role: 'investor' } },
      { $group: { _id: null, totalBalance: { $sum: '$walletBalance' } } }
    ]);
    const platformLiquidity = liquidityAgg.length > 0 ? liquidityAgg[0].totalBalance : 0;

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

    // Generate last 30 days trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Activity trend (signups)
    const activityAgg = await User.aggregate([
      { $match: { role: 'investor', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Deposit trends
    const depositTrendsAgg = await Deposit.aggregate([
      { $match: { status: 'approved', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const last30Days = getLast30Days();

    const activityMap = {};
    activityAgg.forEach(item => {
      activityMap[item._id] = item.count;
    });
    const activityTrend = last30Days.map(date => ({
      date,
      count: activityMap[date] || 0
    }));

    const depositTrendsMap = {};
    depositTrendsAgg.forEach(item => {
      depositTrendsMap[item._id] = item.amount;
    });
    const depositTrend = last30Days.map(date => ({
      date,
      amount: depositTrendsMap[date] || 0
    }));

    // System Status
    let systemStatusSetting = await SystemSetting.findOne({ key: 'system_status' });
    if (!systemStatusSetting) {
      systemStatusSetting = await SystemSetting.create({
        key: 'system_status',
        value: {
          maintenanceMode: false,
          newRegistrations: true,
          withdrawalProcessing: true
        },
        description: 'Global admin system status toggles'
      });
    }

    // Recent Registrations
    const recentUsers = await User.find({ role: 'investor' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email kycStatus');

    const recentRegistrations = await Promise.all(recentUsers.map(async (u) => {
      const activePkg = await UserPackage.findOne({ userId: u._id, status: 'active' })
        .populate('packageId');
      return {
        username: u.username,
        email: u.email,
        plan: activePkg ? activePkg.packageId?.name : 'None',
        status: u.kycStatus
      };
    }));

    // Platform Transactions
    const recentDeposits = await Deposit.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId');

    const recentWithdrawals = await Withdrawal.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId');

    const platformTransactions = [
      ...recentDeposits.map(d => ({
        userId: d.userId?.username || `UID-${String(d.userId?._id).slice(-4)}`,
        trxId: d.transactionId || `DEP-${String(d._id).slice(-6)}`,
        dateTime: d.createdAt,
        amount: d.amount,
        type: 'deposit',
        description: 'Crypto Deposit'
      })),
      ...recentWithdrawals.map(w => ({
        userId: w.userId?.username || `UID-${String(w.userId?._id).slice(-4)}`,
        trxId: `WD-${String(w._id).slice(-6)}`,
        dateTime: w.createdAt,
        amount: -w.amount,
        type: 'withdrawal',
        description: 'Crypto Withdrawal'
      }))
    ]
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          activePackages,
          pendingApprovals,
          platformLiquidity,
          totalDeposits,
          totalWithdrawals,
        },
        activityTrend,
        depositTrend,
        systemStatus: systemStatusSetting.value,
        recentRegistrations,
        platformTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateSystemStatus = async (req, res, next) => {
  try {
    const { maintenanceMode, newRegistrations, withdrawalProcessing } = req.body;
    let setting = await SystemSetting.findOne({ key: 'system_status' });
    if (!setting) {
      setting = new SystemSetting({
        key: 'system_status',
        value: {
          maintenanceMode: false,
          newRegistrations: true,
          withdrawalProcessing: true
        },
        description: 'Global admin system status toggles'
      });
    }

    setting.value = {
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : setting.value.maintenanceMode,
      newRegistrations: newRegistrations !== undefined ? newRegistrations : setting.value.newRegistrations,
      withdrawalProcessing: withdrawalProcessing !== undefined ? withdrawalProcessing : setting.value.withdrawalProcessing
    };

    await setting.save();

    res.status(200).json({
      success: true,
      message: 'System status updated successfully',
      data: setting.value
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getPendingCounts,
  updateSystemStatus,
};

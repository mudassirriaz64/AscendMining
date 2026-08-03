const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Coin = require('../models/Coin');
const Deposit = require('../models/Deposit');
const SystemSetting = require('../models/SystemSetting');

const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).maxTimeMS(10000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
          status: 404,
        },
      });
    }

    // 1. Fetch active packages and populate coins
    const activePackages = await UserPackage.find({ userId, status: 'active' })
      .populate({
        path: 'packageId',
        populate: { path: 'coins', model: 'Coin' },
      })
      .maxTimeMS(10000);

    const isMiningActive = activePackages.length > 0;

    // 2. Collect unique coin IDs from active packages
    const activeCoinIds = new Set();
    activePackages.forEach((pkg) => {
      const pkgCoins = pkg.packageId?.coins || [];
      pkgCoins.forEach((coin) => {
        if (coin && coin._id) activeCoinIds.add(coin._id.toString());
      });
    });

    // 3. Fetch only coins the user actually mines
    const coins = activeCoinIds.size > 0
      ? await Coin.find({ _id: { $in: Array.from(activeCoinIds) }, isActive: true }).maxTimeMS(10000)
      : [];

    const coinRateMap = {};
    coins.forEach((c) => {
      coinRateMap[c.symbol] = c.usdRate || 1.0;
    });

    // 4. Filter miningBalances to only active package coins
    const allMiningBalances = Object.fromEntries(user.miningBalances || new Map());
    const activeSymbols = coins.map((c) => c.symbol);
    const miningBalances = {};
    activeSymbols.forEach((sym) => {
      miningBalances[sym] = allMiningBalances[sym] || 0;
    });

    // 5. Filter walletAddresses to only active package coins
    const allWalletAddresses = Object.fromEntries(user.walletAddresses || new Map());
    const walletAddresses = {};
    activeSymbols.forEach((sym) => {
      walletAddresses[sym] = allWalletAddresses[sym] || '';
    });

    // 6. Calculate mining status from active packages
    let totalHashRate = 0;
    let estToday = {};
    let progressPercent = 0;

    if (isMiningActive) {
      activePackages.forEach((pkg) => {
        totalHashRate += pkg.packageId?.hashRate || 0;

        const pkgCoins = pkg.packageId?.coins || [];
        pkgCoins.forEach((coin) => {
          if (!coin) return;
          const coinRate = coinRateMap[coin.symbol] || 1.0;
          const dailyUsdProfit = pkg.purchaseAmount * (pkg.dailyROISnapshot / 100);
          const coinProfit = dailyUsdProfit / coinRate;
          estToday[coin.symbol] = (estToday[coin.symbol] || 0) + coinProfit;
        });
      });

      // Calculate progress percentage based on the daily claim cycle
      const latestPkg = activePackages[0];
      const cycleEnd = latestPkg.nextMiningAt || latestPkg.cycleEndsAt;
      const cycleStart = latestPkg.lastPayoutAt || latestPkg.cycleStartedAt;
      if (cycleEnd && cycleStart) {
        const start = new Date(cycleStart).getTime();
        const end = new Date(cycleEnd).getTime();
        const now = Date.now();
        if (end > start) {
          progressPercent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
        }
      } else {
        progressPercent = 4;
      }
    }

    // 7. Fetch latest transactions
    const transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .maxTimeMS(10000);

    // Fetch global mining settings
    let mSettings = await SystemSetting.findOne({ key: 'mining_settings' });
    const miningSettings = mSettings ? mSettings.value : { timerDuration: 24, isPaused: false, isDisabled: false };

    res.status(200).json({
      success: true,
      data: {
        balances: {
          walletBalance: user.walletBalance || 0,
          miningBalances,
        },
        walletAddresses,
        miningStatus: {
          status: isMiningActive ? 'active' : 'inactive',
          progressPercent,
          estToday,
          hashRate: totalHashRate,
        },
        coins,
        activePackages,
        latestTransactions: transactions,
        miningSettings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [deposits, total] = await Promise.all([
      Deposit.find({ userId: req.user.id })
        .populate('packageId')
        .populate('paymentMethod')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Deposit.countDocuments({ userId: req.user.id })
    ]);
    res.status(200).json({ success: true, data: { deposits, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = { userId: req.user.id };
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WalletTransaction.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, data: { transactions, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardSummary,
  getMyDeposits,
  getMyTransactions,
};

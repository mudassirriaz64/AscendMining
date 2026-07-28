const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Coin = require('../models/Coin');

const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

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
      });

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
      ? await Coin.find({ _id: { $in: Array.from(activeCoinIds) }, isActive: true })
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
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        balances: {
          walletBalance: user.walletBalance || 0,
          referralBalance: user.referralBalance || 0,
          miningBalances,
        },
        walletAddresses,
        referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
        miningStatus: {
          status: isMiningActive ? 'active' : 'inactive',
          progressPercent,
          estToday,
          hashRate: totalHashRate,
        },
        coins,
        activePackage: isMiningActive ? activePackages[0] : null,
        latestTransactions: transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};

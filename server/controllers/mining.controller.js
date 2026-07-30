const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Coin = require('../models/Coin');
const Package = require('../models/Package');
const SystemSetting = require('../models/SystemSetting');
const { emitMiningUpdate, emitTransactionUpdate } = require('../utils/dashboardEvents');

const claimMiningReward = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { userPackageId } = req.params;

    // Check global mining settings
    let settings = await SystemSetting.findOne({ key: 'mining_settings' });
    const miningSettings = settings ? settings.value : { timerDuration: 24, isPaused: false, isDisabled: false };

    if (miningSettings.isDisabled) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MINING_DISABLED',
          message: 'The mining system is currently disabled by the administrator.',
          status: 400
        }
      });
    }

    if (miningSettings.isPaused) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MINING_PAUSED',
          message: 'Mining claims are currently paused by the administrator.',
          status: 400
        }
      });
    }

    const userPackage = await UserPackage.findById(userPackageId);

    if (!userPackage) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Active package not found.',
          status: 404,
        },
      });
    }

    // Verify ownership and status
    if (userPackage.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this package.',
          status: 403,
        },
      });
    }

    if (userPackage.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INACTIVE_PACKAGE',
          message: 'This package is not currently active.',
          status: 400,
        },
      });
    }

    // Verify timer cooldown
    const now = new Date();
    if (userPackage.nextMiningAt && now < new Date(userPackage.nextMiningAt)) {
      const remainingMs = new Date(userPackage.nextMiningAt).getTime() - now.getTime();
      const remainingSecs = Math.ceil(remainingMs / 1000);
      return res.status(400).json({
        success: false,
        error: {
          code: 'COOLDOWN_ACTIVE',
          message: 'Mining reward is not ready to claim yet.',
          status: 400,
          details: { remainingSecs },
        },
      });
    }

    // Fetch package details with populated coins
    const basePkg = await Package.findById(userPackage.packageId).populate('coins');
    const planName = basePkg ? basePkg.name : 'Mining Plan';
    const pkgCoins = basePkg?.coins || [];

    if (pkgCoins.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_COINS_CONFIGURED',
          message: 'This package has no coins configured for mining.',
          status: 400,
        },
      });
    }

    // Fetch user and calculate payout for each coin
    const user = await User.findById(userId);
    if (!user.miningBalances) user.miningBalances = new Map();

    const payoutResults = [];

    for (const coin of pkgCoins) {
      const coinRate = coin.usdRate || 1.0;
      const usdProfit = userPackage.purchaseAmount * (userPackage.dailyROISnapshot / 100);
      const coinProfit = usdProfit / coinRate;

      const currentBalance = user.miningBalances.get(coin.symbol) || 0;
      user.miningBalances.set(coin.symbol, currentBalance + coinProfit);

      // Create a payout transaction for each coin
      const walletTx = await WalletTransaction.create({
        userId,
        type: 'mining_payout',
        amount: coinProfit,
        coinSymbol: coin.symbol,
        referenceType: 'UserPackage',
        referenceId: userPackage._id,
        balanceAfter: user.miningBalances.get(coin.symbol),
        reason: `Daily return amount for the plan ${planName}`,
      });

      payoutResults.push({ 
        coinSymbol: coin.symbol, 
        amountClaimed: coinProfit,
        txId: walletTx._id,
        reason: walletTx.reason || `Daily return amount for the plan ${planName}`
      });
    }

    await user.save();

    // Update package timers
    const timerDurationHours = miningSettings.timerDuration || 24;
    userPackage.lastPayoutAt = now;
    userPackage.nextMiningAt = new Date(Date.now() + timerDurationHours * 60 * 60 * 1000);
    userPackage.isMining = true;
    await userPackage.save();

    // Emit real-time updates to dashboard
    const { emitBalanceUpdate } = require('../utils/dashboardEvents');
    emitBalanceUpdate(req.app, userId, { miningBalances: Object.fromEntries(user.miningBalances) });

    const activePackages = await UserPackage.find({ userId, status: 'active' }).populate({
      path: 'packageId',
      populate: { path: 'coins', model: 'Coin' }
    });

    emitMiningUpdate(req.app, userId, {
      miningStatus: { progressPercent: 0 },
      activePackages,
    });

    const now2 = new Date();
    payoutResults.forEach((pr) => {
      emitTransactionUpdate(req.app, userId, {
        _id: pr.txId,
        type: 'mining_payout',
        amount: pr.amountClaimed,
        coinSymbol: pr.coinSymbol,
        balanceAfter: user.miningBalances.get(pr.coinSymbol),
        reason: pr.reason,
        createdAt: now2,
      });
    });

    res.status(200).json({
      success: true,
      message: 'Mining reward claimed successfully.',
      data: {
        payouts: payoutResults,
        miningBalances: Object.fromEntries(user.miningBalances),
        nextMiningAt: userPackage.nextMiningAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserMiningTracks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tracks = await UserPackage.find({ userId })
      .populate({
        path: 'packageId',
        populate: { path: 'coins', model: 'Coin' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  claimMiningReward,
  getUserMiningTracks,
};

const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Coin = require('../models/Coin');
const Package = require('../models/Package');

const claimMiningReward = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { userPackageId } = req.params;

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
      await WalletTransaction.create({
        userId,
        type: 'mining_payout',
        amount: coinProfit,
        coinSymbol: coin.symbol,
        referenceType: 'UserPackage',
        referenceId: userPackage._id,
        balanceAfter: user.miningBalances.get(coin.symbol),
        reason: `Daily return amount for the plan ${planName}`,
      });

      payoutResults.push({ coinSymbol: coin.symbol, amountClaimed: coinProfit });
    }

    await user.save();

    // Update package timers
    userPackage.lastPayoutAt = now;
    userPackage.nextMiningAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    userPackage.isMining = true;
    await userPackage.save();

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

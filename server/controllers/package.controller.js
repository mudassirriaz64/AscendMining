const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const Deposit = require('../models/Deposit');
const PaymentMethod = require('../models/PaymentMethod');
const { emitBalanceUpdate, emitMiningUpdate, emitTransactionUpdate } = require('../utils/dashboardEvents');

const listPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ status: 'active' }).populate('coins');
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

const purchasePackage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Package ID is required.',
          status: 400,
        },
      });
    }

    // 1. Fetch package
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'The selected mining package does not exist.',
          status: 404,
        },
      });
    }

    // 2. Fetch User and check walletBalance
    const User = require('../models/User');
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

    if (user.walletBalance < pkg.price) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Insufficient wallet balance. You need $${pkg.price.toFixed(2)} to purchase this plan, but your current balance is $${user.walletBalance.toFixed(2)}. Please top up your wallet first.`,
          status: 400,
        },
      });
    }

    // 3. Deduct balance
    user.walletBalance -= pkg.price;
    await user.save();

    // 4. Create and activate UserPackage instantly
    const WalletTransaction = require('../models/WalletTransaction');
    
    const startDate = new Date();
    const cycleEnds = new Date();
    cycleEnds.setDate(cycleEnds.getDate() + pkg.duration);

    const userPackage = await UserPackage.create({
      userId,
      packageId: pkg._id,
      purchaseAmount: pkg.price,
      dailyROISnapshot: pkg.dailyROI,
      durationSnapshot: pkg.duration,
      hashRateSnapshot: pkg.hashRate,
      status: 'active',
      startDate,
      endDate: cycleEnds,
      isMining: true,
      cycleStartedAt: startDate,
      cycleEndsAt: cycleEnds,
      nextMiningAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next payout 24h from now
    });

    // 5. Create package purchase transaction log
    const transaction = await WalletTransaction.create({
      userId: user._id,
      currency: 'USD',
      type: 'package_purchase',
      amount: -pkg.price,
      referenceType: 'UserPackage',
      referenceId: userPackage._id,
      balanceAfter: user.walletBalance,
    });

    // Emit real-time updates for balance, mining, and transaction
    const app = req.app;
    emitBalanceUpdate(app, userId, { walletBalance: user.walletBalance });
    emitMiningUpdate(app, userId, {
      activePackage: {
        _id: userPackage._id,
        packageId: { name: pkg.name, _id: pkg._id },
        purchaseAmount: pkg.price,
        dailyROISnapshot: pkg.dailyROI,
        startDate,
        cycleStartedAt: startDate,
        cycleEndsAt: cycleEnds,
        nextMiningAt: userPackage.nextMiningAt,
      },
      miningStatus: { status: 'active', progressPercent: 0, hashRate: pkg.hashRate },
    });
    emitTransactionUpdate(app, userId, {
      _id: transaction._id,
      type: 'package_purchase',
      amount: -pkg.price,
      currency: 'USD',
      balanceAfter: user.walletBalance,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Plan purchased successfully! Mining is now active.',
      data: {
        userPackage,
        transaction,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPackages,
  purchasePackage,
};

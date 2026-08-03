const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Coin = require('../models/Coin');
const Package = require('../models/Package');
const SystemSetting = require('../models/SystemSetting');
const { emitBalanceUpdate, emitMiningUpdate, emitTransactionUpdate } = require('../utils/dashboardEvents');

const runMiningPayoutCheck = async (app) => {
  try {
    // 1. Check global mining settings
    const settings = await SystemSetting.findOne({ key: 'mining_settings' });
    const miningSettings = settings ? settings.value : { timerDuration: 24, isPaused: false, isDisabled: false };

    if (miningSettings.isDisabled || miningSettings.isPaused) {
      return;
    }

    const now = new Date();

    // 2. Fetch all active packages whose nextMiningAt has elapsed
    const eligiblePackages = await UserPackage.find({
      status: 'active',
      isMining: true,
      nextMiningAt: { $lte: now }
    });

    if (eligiblePackages.length === 0) return;

    const timerDurationHours = miningSettings.timerDuration || 24;
    const timerDurationMs = timerDurationHours * 60 * 60 * 1000;

    for (const targetPkg of eligiblePackages) {
      // 3. Apply atomic lock to advance nextMiningAt to prevent double payouts
      const nextPayoutTime = new Date(Date.now() + timerDurationMs);

      const pkg = await UserPackage.findOneAndUpdate(
        {
          _id: targetPkg._id,
          status: 'active',
          isMining: true,
          nextMiningAt: { $lte: now }
        },
        {
          $set: {
            nextMiningAt: nextPayoutTime,
            lastPayoutAt: now
          }
        },
        { new: true }
      );

      if (!pkg) {
        // Concurrency Lock: Document was already claimed by another process
        continue;
      }

      // 4. Expiration check: check if the package cycle has ended
      const isExpired = pkg.cycleEndsAt && now >= new Date(pkg.cycleEndsAt);

      // 5. Fetch package and configured coins details
      const basePkg = await Package.findById(pkg.packageId).populate('coins');
      const planName = basePkg ? basePkg.name : 'Mining Plan';
      const pkgCoins = basePkg?.coins || [];

      if (pkgCoins.length === 0) {
        console.warn(`[Mining Cron] Active package ${pkg._id} has no configured coins.`);
        continue;
      }

      // 6. Fetch user profile
      const user = await User.findById(pkg.userId);
      if (!user) continue;

      if (!user.miningBalances) user.miningBalances = new Map();

      const payoutResults = [];

      // 7. Calculate and distribute payouts to the user's balances
      for (const coin of pkgCoins) {
        const coinRate = coin.usdRate || 1.0;
        const usdProfit = pkg.purchaseAmount * (pkg.dailyROISnapshot / 100);
        const coinProfit = usdProfit / coinRate;

        const currentBalance = user.miningBalances.get(coin.symbol) || 0;
        user.miningBalances.set(coin.symbol, currentBalance + coinProfit);

        // Record daily yield in WalletTransaction ledger
        const walletTx = await WalletTransaction.create({
          userId: user._id,
          type: 'mining_payout',
          amount: coinProfit,
          coinSymbol: coin.symbol,
          referenceType: 'UserPackage',
          referenceId: pkg._id,
          balanceAfter: user.miningBalances.get(coin.symbol),
          reason: `Daily return amount for the plan ${planName}`,
        });

        payoutResults.push({
          coinSymbol: coin.symbol,
          amountClaimed: coinProfit,
          txId: walletTx._id,
          reason: walletTx.reason,
        });
      }

      await user.save();

      // Deactivate and mark completed if cycle has expired
      if (isExpired) {
        pkg.status = 'completed';
        pkg.isMining = false;
        pkg.nextMiningAt = null;
        await pkg.save();
      }

      // 8. Push real-time Socket.io updates to the frontend dashboard
      emitBalanceUpdate(app, user._id, { miningBalances: Object.fromEntries(user.miningBalances) });

      const activePackages = await UserPackage.find({ userId: user._id, status: 'active' }).populate({
        path: 'packageId',
        populate: { path: 'coins', model: 'Coin' }
      });

      emitMiningUpdate(app, user._id, {
        miningStatus: { progressPercent: 0 },
        activePackages,
      });

      const payoutTime = new Date();
      payoutResults.forEach((pr) => {
        emitTransactionUpdate(app, user._id, {
          _id: pr.txId,
          type: 'mining_payout',
          amount: pr.amountClaimed,
          coinSymbol: pr.coinSymbol,
          balanceAfter: user.miningBalances.get(pr.coinSymbol),
          reason: pr.reason,
          createdAt: payoutTime,
        });
      });

      console.log(`[Mining Cron] Distributed payout for package ${pkg._id} to User ${user._id}`);
    }
  } catch (err) {
    console.error('[Mining Cron] Error during payout check:', err.message);
  }
};

const startMiningPayoutCron = (app) => {
  runMiningPayoutCheck(app).catch((err) => console.error('[Mining Cron] Check failed:', err.message));
  return setInterval(() => {
    runMiningPayoutCheck(app).catch((err) => console.error('[Mining Cron] Check failed:', err.message));
  }, 10 * 1000);
};

module.exports = { startMiningPayoutCron, runMiningPayoutCheck };

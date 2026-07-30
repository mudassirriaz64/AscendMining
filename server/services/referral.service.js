const User = require('../models/User');
const Referral = require('../models/Referral');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const UserPackage = require('../models/UserPackage');
const Deposit = require('../models/Deposit');

/**
 * Checks if a user is active and has any pending referrals. If so, releases the bonuses.
 * @param {string} referredUserId - The user who was referred
 */
const checkAndReleaseReferralRewards = async (referredUserId) => {
  try {
    const referredUser = await User.findById(referredUserId);
    if (!referredUser || referredUser.status !== 'active') {
      return;
    }

    // Find all pending referrals for this referred user
    const pendingReferrals = await Referral.find({ referredUser: referredUserId, status: 'pending' });
    
    for (const referral of pendingReferrals) {
      const referrer = await User.findById(referral.referrer);
      if (!referrer) continue;

      // Self-referral fraud detection check
      if (referrer._id.equals(referredUser._id)) {
        referral.status = 'blocked';
        referral.blockedReason = 'Self-referral detected.';
        await referral.save();
        continue;
      }

      // Check if referrer and referee have identical IP addresses/payment details
      // Simple fraud detection rule: if same username or names are too identical (or IP address matches, if logged)
      // Here, we flag it or handle it based on simple rules
      if (referrer.email === referredUser.email) {
        referral.status = 'blocked';
        referral.blockedReason = 'Duplicate email registration.';
        await referral.save();
        continue;
      }

      // Get referral settings
      let settings = await SystemSetting.findOne({ key: 'referral_settings' });
      const isActive = settings ? settings.value.isActive : true;
      const bonusPercentage = settings ? settings.value.bonusPercentage : 10;

      if (!isActive) continue;

      // Find qualifying activity (either plan purchase or deposit)
      const activePackage = await UserPackage.findOne({ userId: referredUserId, status: 'active' }).sort({ createdAt: -1 });
      const approvedDeposit = await Deposit.findOne({ userId: referredUserId, status: 'approved' }).sort({ createdAt: -1 });

      let triggerAmount = 0;
      let reason = '';
      
      if (activePackage) {
        triggerAmount = activePackage.purchaseAmount;
        reason = `Referral reward from ${referredUser.username}'s plan purchase ($${triggerAmount.toFixed(2)})`;
      } else if (approvedDeposit) {
        triggerAmount = approvedDeposit.amount;
        reason = `Referral reward from ${referredUser.username}'s deposit ($${triggerAmount.toFixed(2)})`;
      }

      if (triggerAmount > 0) {
        const bonusAmount = triggerAmount * (bonusPercentage / 100);

        // Credit referrer wallet and referral balances
        referrer.walletBalance = (referrer.walletBalance || 0) + bonusAmount;
        referrer.referralBalance = (referrer.referralBalance || 0) + bonusAmount;
        await referrer.save();

        // Update referral record to qualified
        referral.status = 'qualified';
        referral.bonus = (referral.bonus || 0) + bonusAmount;
        referral.qualifiedAt = new Date();
        referral.qualifyingUserPackageId = activePackage ? activePackage._id : null;
        await referral.save();

        // Log transaction for referrer
        await WalletTransaction.create({
          userId: referrer._id,
          currency: 'USD',
          type: 'referral_reward',
          amount: bonusAmount,
          referenceType: 'Referral',
          referenceId: referral._id,
          balanceAfter: referrer.walletBalance,
          reason,
        });

        // Notify referrer
        await Notification.create({
          userId: referrer._id,
          title: 'Referral Bonus Earned',
          message: `You earned a $${bonusAmount.toFixed(2)} bonus from your referral ${referredUser.username}'s activity.`,
          type: 'success',
          link: '/referral-logs',
        });
      }
    }
  } catch (error) {
    console.error(`[ReferralService] Error releasing referral rewards for user ${referredUserId}:`, error);
  }
};

module.exports = {
  checkAndReleaseReferralRewards,
};

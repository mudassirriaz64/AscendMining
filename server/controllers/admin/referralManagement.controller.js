const User = require('../../models/User');
const Referral = require('../../models/Referral');
const SystemSetting = require('../../models/SystemSetting');
const WalletTransaction = require('../../models/WalletTransaction');

const getReferralSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'referral_settings' });
    
    if (!settings) {
      settings = await SystemSetting.create({
        key: 'referral_settings',
        value: {
          isActive: true,
          bonusPercentage: 10,
        },
        description: 'Global configuration for the referral system',
      });
    }

    res.status(200).json({
      success: true,
      data: { settings: settings.value },
    });
  } catch (error) {
    next(error);
  }
};

const updateReferralSettings = async (req, res, next) => {
  try {
    const { isActive, bonusPercentage } = req.body;
    
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'referral_settings' },
      { value: { isActive, bonusPercentage } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Referral settings updated successfully',
      data: { settings: settings.value },
    });
  } catch (error) {
    next(error);
  }
};

const getGlobalReferralRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find()
      .populate('referrer', 'username email fullName')
      .populate('referredUser', 'username email fullName status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments();

    // Fetch total bonuses paid out
    const totalBonusesAgg = await WalletTransaction.aggregate([
      { $match: { type: 'referral_reward', amount: { $gt: 0 } } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalBonuses = totalBonusesAgg.length > 0 ? totalBonusesAgg[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      data: {
        referrals,
        stats: {
          totalReferrals: total,
          totalBonusesPaid: totalBonuses,
        },
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReferralSettings,
  updateReferralSettings,
  getGlobalReferralRecords,
};

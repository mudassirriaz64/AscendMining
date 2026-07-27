const User = require('../models/User');
const Coin = require('../models/Coin');
const Withdrawal = require('../models/Withdrawal');
const WalletTransaction = require('../models/WalletTransaction');

const requestWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { coinSymbol, amount } = req.body;

    if (!coinSymbol || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Please provide a valid coin symbol and amount.',
          status: 400,
        },
      });
    }

    // 1. Validate the coin exists and is active
    const coin = await Coin.findOne({ symbol: coinSymbol, isActive: true });
    if (!coin) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COIN_NOT_SUPPORTED',
          message: `The coin ${coinSymbol} is not currently supported or active for withdrawals.`,
          status: 400,
        },
      });
    }

    // 2. Validate amount is within limits
    if (amount < coin.minWithdrawal || amount > coin.maxWithdrawal) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_VIOLATION',
          message: `Withdrawal amount must be between ${coin.minWithdrawal} ${coinSymbol} and ${coin.maxWithdrawal} ${coinSymbol}.`,
          status: 400,
        },
      });
    }

    // 3. Validate user has wallet address set
    const user = await User.findById(userId);
    if (!user.walletAddresses) {
      user.walletAddresses = new Map();
    }
    const walletAddress = user.walletAddresses.get(coinSymbol);
    if (!walletAddress || !walletAddress.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_CONFIGURED',
          message: `Please configure your ${coinSymbol} wallet address in account settings first.`,
          status: 400,
        },
      });
    }

    // 4. Validate sufficient balance
    if (!user.miningBalances) {
      user.miningBalances = new Map();
    }
    const balance = user.miningBalances.get(coinSymbol) || 0;
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Insufficient ${coinSymbol} balance. Available: ${balance.toFixed(8)} ${coinSymbol}.`,
          status: 400,
        },
      });
    }

    // 5. Deduct balance and save
    user.miningBalances.set(coinSymbol, balance - amount);
    await user.save();

    // 6. Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId,
      coinSymbol,
      amount,
      walletAddress,
      status: 'pending',
    });

    // 7. Create Wallet transaction logs
    await WalletTransaction.create({
      userId,
      type: 'withdrawal',
      amount: -amount,
      coinSymbol,
      referenceType: 'Withdrawal',
      referenceId: withdrawal._id,
      balanceAfter: user.miningBalances.get(coinSymbol),
      reason: `Withdrawal request for ${amount} ${coinSymbol}`,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully and is pending admin approval.',
      data: {
        withdrawal,
        miningBalances: Object.fromEntries(user.miningBalances),
      },
    });
  } catch (error) {
    next(error);
  }
};

const listWithdrawals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const withdrawals = await Withdrawal.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestWithdrawal,
  listWithdrawals,
};

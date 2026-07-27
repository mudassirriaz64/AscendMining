const User = require('../models/User');

const updateWalletAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { coinSymbol, address } = req.body;

    if (!coinSymbol || !address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Please provide both coin symbol and address.',
          status: 400,
        },
      });
    }

    const user = await User.findById(userId);
    if (!user.walletAddresses) {
      user.walletAddresses = new Map();
    }

    user.walletAddresses.set(coinSymbol, address.trim());
    await user.save();

    res.status(200).json({
      success: true,
      message: `${coinSymbol} wallet address updated successfully.`,
      data: {
        walletAddresses: Object.fromEntries(user.walletAddresses),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateWalletAddress,
};

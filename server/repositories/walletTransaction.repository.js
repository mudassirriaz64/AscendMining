const WalletTransaction = require('../models/WalletTransaction');

const create = async (data) => {
  return WalletTransaction.create(data);
};

const findByUser = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments({ userId }),
  ]);
  return { transactions, total, page, limit };
};

const getBalance = async (userId) => {
  const result = await WalletTransaction.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('balanceAfter');
  return result ? result.balanceAfter : 0;
};

module.exports = {
  create,
  findByUser,
  getBalance,
};

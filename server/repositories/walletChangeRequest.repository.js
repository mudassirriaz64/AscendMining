const WalletChangeRequest = require('../models/WalletChangeRequest');

const findById = (id) => {
  return WalletChangeRequest.findById(id);
};

const create = (data) => {
  return WalletChangeRequest.create(data);
};

const findAll = (filter, options = {}) => {
  const query = WalletChangeRequest.find(filter);
  if (options.populate) {
    options.populate.forEach((p) => query.populate(p));
  }
  if (options.sort) query.sort(options.sort);
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);
  return query;
};

const countByFilter = (filter) => {
  return WalletChangeRequest.countDocuments(filter);
};

const updateById = (id, update, options = { new: true }) => {
  return WalletChangeRequest.findByIdAndUpdate(id, update, options);
};

/**
 * Check if a user already has a pending request for a specific coin.
 */
const findPendingByUserAndCoin = (userId, coinSymbol) => {
  return WalletChangeRequest.findOne({ userId, coinSymbol, status: 'pending' });
};

module.exports = {
  findById,
  create,
  findAll,
  countByFilter,
  updateById,
  findPendingByUserAndCoin,
};

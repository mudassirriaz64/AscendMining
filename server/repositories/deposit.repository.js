const Deposit = require('../models/Deposit');

const findById = (id) => {
  return Deposit.findById(id);
};

const create = (data) => {
  return Deposit.create(data);
};

const findByScreenshotHash = (hash) => {
  return Deposit.findOne({ screenshotHash: hash });
};

const findAll = (filter, options = {}) => {
  const query = Deposit.find(filter);
  if (options.populate) {
    options.populate.forEach((p) => query.populate(p));
  }
  if (options.sort) query.sort(options.sort);
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);
  return query;
};

const countByFilter = (filter) => {
  return Deposit.countDocuments(filter);
};

const updateById = (id, update) => {
  return Deposit.findByIdAndUpdate(id, update, { new: true });
};

module.exports = {
  findById,
  create,
  findByScreenshotHash,
  findAll,
  countByFilter,
  updateById,
};

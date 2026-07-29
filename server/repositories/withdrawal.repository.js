const Withdrawal = require('../models/Withdrawal');

const findById = (id) => {
  return Withdrawal.findById(id);
};

const create = (data) => {
  return Withdrawal.create(data);
};

const findAll = (filter, options = {}) => {
  const query = Withdrawal.find(filter);
  if (options.populate) {
    options.populate.forEach((p) => query.populate(p));
  }
  if (options.sort) query.sort(options.sort);
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);
  return query;
};

const countByFilter = (filter) => {
  return Withdrawal.countDocuments(filter);
};

const updateById = (id, update) => {
  return Withdrawal.findByIdAndUpdate(id, update, { new: true });
};

module.exports = {
  findById,
  create,
  findAll,
  countByFilter,
  updateById,
};

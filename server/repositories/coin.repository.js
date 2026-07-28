const Coin = require('../models/Coin');

const findAll = async (filter = {}, { skip = 0, limit = 100, sort = { createdAt: -1 } } = {}) => {
  return Coin.find(filter).sort(sort).skip(skip).limit(limit);
};

const findById = async (id) => {
  return Coin.findById(id);
};

const findBySymbol = async (symbol) => {
  return Coin.findOne({ symbol: symbol.toUpperCase() });
};

const findActive = async () => {
  return Coin.find({ isActive: true }).sort({ name: 1 });
};

const create = async (data) => {
  return Coin.create(data);
};

const updateById = async (id, updateData) => {
  return Coin.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
};

const countByFilter = async (filter = {}) => {
  return Coin.countDocuments(filter);
};

module.exports = {
  findAll,
  findById,
  findBySymbol,
  findActive,
  create,
  updateById,
  countByFilter,
};

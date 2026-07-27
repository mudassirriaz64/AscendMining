const Package = require('../models/Package');

const findAll = async (filter = {}, { skip = 0, limit = 100, sort = { createdAt: -1 } } = {}) => {
  return Package.find(filter).populate('coins', 'name symbol logoUrl').sort(sort).skip(skip).limit(limit);
};

const findById = async (id) => {
  return Package.findById(id).populate('coins', 'name symbol logoUrl isActive miningAvailable');
};

const findActive = async () => {
  return Package.find({ status: 'active' })
    .populate('coins', 'name symbol logoUrl isActive miningAvailable')
    .sort({ price: 1 });
};

const create = async (data) => {
  const pkg = await Package.create(data);
  return pkg.populate('coins', 'name symbol logoUrl isActive miningAvailable');
};

const updateById = async (id, updateData) => {
  return Package.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(
    'coins',
    'name symbol logoUrl isActive miningAvailable'
  );
};

const countByFilter = async (filter = {}) => {
  return Package.countDocuments(filter);
};

module.exports = {
  findAll,
  findById,
  findActive,
  create,
  updateById,
  countByFilter,
};

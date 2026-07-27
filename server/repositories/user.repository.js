const User = require('../models/User');

const findByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase() });
};

const findByEmailWithPassword = async (email) => {
  return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

const findByUsername = async (username) => {
  return User.findOne({ username });
};

const findByReferralCode = async (referralCode) => {
  return User.findOne({ referralCode: referralCode.toUpperCase() });
};

const findById = async (id) => {
  return User.findById(id);
};

const create = async (userData) => {
  return User.create(userData);
};

const updateById = async (id, updateData) => {
  return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const existsByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('_id');
  return !!user;
};

const existsByUsername = async (username) => {
  const user = await User.findOne({ username }).select('_id');
  return !!user;
};

module.exports = {
  findByEmail,
  findByEmailWithPassword,
  findByUsername,
  findByReferralCode,
  findById,
  create,
  updateById,
  existsByEmail,
  existsByUsername,
};

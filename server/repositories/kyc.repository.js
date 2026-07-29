const User = require('../models/User');

const findPending = (options = {}) => {
  const query = User.find(
    { kycStatus: 'pending' },
    'username email fullName kycStatus kycDocumentType kycDocumentUrl kycPersonalInfo updatedAt'
  );
  if (options.sort) query.sort(options.sort);
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);
  return query;
};

const countPending = () => {
  return User.countDocuments({ kycStatus: 'pending' });
};

const updateKycStatus = (userId, data) => {
  return User.findByIdAndUpdate(userId, data, { new: true });
};

module.exports = {
  findPending,
  countPending,
  updateKycStatus,
};

const RefreshToken = require('../models/RefreshToken');
const { JWT_REFRESH_EXPIRY_MS } = require('../config/constants');

const create = async (tokenHash, userId) => {
  const expiresAt = new Date(Date.now() + JWT_REFRESH_EXPIRY_MS);
  return RefreshToken.create({ tokenHash, userId, expiresAt });
};

const findValid = async (tokenHash) => {
  return RefreshToken.findOne({
    tokenHash,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });
};

const revoke = async (tokenHash) => {
  return RefreshToken.updateOne({ tokenHash }, { $set: { revoked: true } });
};

const revokeAllForUser = async (userId) => {
  return RefreshToken.updateMany({ userId }, { $set: { revoked: true } });
};

module.exports = {
  create,
  findValid,
  revoke,
  revokeAllForUser,
};

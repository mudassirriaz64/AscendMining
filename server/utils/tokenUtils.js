const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = require('../config/constants');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
};

const generateRefreshToken = () => {
  return {
    token: uuidv4(),
    rawToken: uuidv4(),
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
};

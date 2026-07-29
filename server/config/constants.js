module.exports = {
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '30d',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '30d',
  JWT_REFRESH_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000,
  BCRYPT_ROUNDS: 12,
  PASSWORD_RESET_EXPIRY_MINUTES: 15,
  REFERRAL_CODE_LENGTH: 8,
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
  AUTH_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 10,
  },
};

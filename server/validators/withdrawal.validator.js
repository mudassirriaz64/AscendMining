const { z } = require('zod');

const requestWithdrawalSchema = z.object({
  coinSymbol: z
    .string()
    .min(1, 'Coin symbol is required.')
    .toUpperCase(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Withdrawal amount must be a positive number.'),
});

module.exports = {
  requestWithdrawalSchema,
};

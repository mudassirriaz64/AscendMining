const { z } = require('zod');

const submitWalletChangeRequestSchema = z.object({
  coinSymbol: z
    .string()
    .min(1, 'Coin symbol is required.')
    .max(20, 'Coin symbol must be at most 20 characters.')
    .trim(),
  requestedWalletAddress: z
    .string()
    .min(10, 'Wallet address must be at least 10 characters.')
    .max(200, 'Wallet address must be at most 200 characters.')
    .trim(),
});

module.exports = { submitWalletChangeRequestSchema };

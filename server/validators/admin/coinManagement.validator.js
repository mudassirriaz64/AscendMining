const { z } = require('zod');

const COIN_SYMBOLS = [
  'BTC', 'ETH', 'USDT', 'USDC', 'DOGE', 'LTC', 'TRX', 'BNB', 'SOL', 'MATIC',
  'ADA', 'DOT', 'AVAX', 'LINK', 'UNI', 'SHIB', 'XRP', 'BCH', 'ETC', 'FIL',
  'APT', 'ARB', 'OP', 'TON', 'NOT',
];

const createCoinSchema = z.object({
  name: z.string().min(1, 'Coin name is required.').max(50),
  symbol: z
    .string()
    .min(1, 'Coin symbol is required.')
    .max(10)
    .transform((val) => val.toUpperCase()),
  logoUrl: z.string().url('Must be a valid URL.').nullable().optional(),
  miningAvailable: z.boolean().default(true),
  usdRate: z.number().min(0.00000001, 'USD rate must be positive.').default(1.0),
  minWithdrawal: z.number().min(0, 'Min withdrawal must be positive.').default(1.0),
  maxWithdrawal: z.number().min(0, 'Max withdrawal must be positive.').default(10.0),
  isActive: z.boolean().default(false),
});

const updateCoinSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform((val) => val.toUpperCase())
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
  miningAvailable: z.boolean().optional(),
  usdRate: z.number().min(0.00000001).optional(),
  minWithdrawal: z.number().min(0).optional(),
  maxWithdrawal: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const coinIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coin ID.'),
});

const listCoinsSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  COIN_SYMBOLS,
  createCoinSchema,
  updateCoinSchema,
  coinIdParamSchema,
  listCoinsSchema,
};

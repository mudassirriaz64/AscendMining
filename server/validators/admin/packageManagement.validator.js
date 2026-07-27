const { z } = require('zod');

const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required.').max(100),
  description: z.string().max(500).optional().default(''),
  price: z.number().min(0.01, 'Price must be positive.'),
  dailyROI: z.number().min(0.01, 'Daily ROI must be positive.'),
  duration: z.number().int().min(1, 'Duration must be at least 1 day.'),
  hashRate: z.number().min(0).optional().default(0),
  coins: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coin ID.'))
    .min(1, 'At least one coin is required.'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

const updatePackageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0.01).optional(),
  dailyROI: z.number().min(0.01).optional(),
  duration: z.number().int().min(1).optional(),
  hashRate: z.number().min(0).optional(),
  coins: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid coin ID.'))
    .min(1)
    .optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const packageIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID.'),
});

const listPackagesSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  createPackageSchema,
  updatePackageSchema,
  packageIdParamSchema,
  listPackagesSchema,
};

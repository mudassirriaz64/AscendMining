const { z } = require('zod');

const listUsersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'unverified']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID.'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

const suspendUserSchema = z.object({
  reason: z.string().min(1, 'A reason is required for suspension.'),
});

module.exports = {
  listUsersSchema,
  userIdParamSchema,
  paginationSchema,
  suspendUserSchema,
};

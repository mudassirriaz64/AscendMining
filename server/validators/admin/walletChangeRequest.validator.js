const { z } = require('zod');

const rejectWalletChangeSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, 'Rejection reason is required.')
    .max(500, 'Rejection reason must be at most 500 characters.'),
});

module.exports = { rejectWalletChangeSchema };

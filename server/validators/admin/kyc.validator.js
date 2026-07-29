const { z } = require('zod');

const rejectKYCSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required.')
    .max(500, 'Rejection reason must be at most 500 characters.'),
});

module.exports = {
  rejectKYCSchema,
};

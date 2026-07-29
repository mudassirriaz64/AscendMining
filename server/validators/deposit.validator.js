const { z } = require('zod');

const submitDepositSchema = z.object({
  paymentMethodId: z
    .string()
    .min(1, 'Payment method ID is required.')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID format.'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Deposit amount must be a positive number.'),
  screenshot: z
    .string()
    .min(1, 'Payment proof screenshot is required.'),
  senderHolderName: z.string().optional().nullable(),
  senderPhone: z.string().optional().nullable(),
  senderBankName: z.string().optional().nullable(),
});

module.exports = {
  submitDepositSchema,
};

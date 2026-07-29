const { z } = require('zod');

const submitKYCSchema = z.object({
  documentType: z
    .enum(['cnic', 'driver_license', 'passport'], {
      errorMap: () => ({ message: 'Invalid document type. Allowed CNIC, Driver License, Passport.' }),
    }),
  documentImage: z
    .string()
    .min(1, 'Document image is required.'),
  fullName: z
    .string()
    .min(1, 'Full name is required.'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required.'),
  documentNumber: z
    .string()
    .min(1, 'Document number is required.'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

module.exports = {
  submitKYCSchema,
};

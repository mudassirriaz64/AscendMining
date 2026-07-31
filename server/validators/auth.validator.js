const { z } = require('zod');

const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters'),
  username: z
    .string()
    .min(3, 'Username must be 3–20 characters, letters/numbers/underscore only.')
    .max(20, 'Username must be 3–20 characters, letters/numbers/underscore only.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be 3–20 characters, letters/numbers/underscore only.'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[a-zA-Z]/, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[0-9]/, 'Password must be at least 8 characters with a letter and a number.'),
  confirmPassword: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'Email or username is required.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address.'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[a-zA-Z]/, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[0-9]/, 'Password must be at least 8 characters with a letter and a number.'),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const verifyOTPSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address.'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits.')
    .regex(/^\d{6}$/, 'OTP must be 6 digits.'),
});

const verifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address.'),
  otp: z
    .string()
    .length(6, 'Verification code must be 6 digits.')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits.'),
});

const resendVerificationOTPSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address.'),
});

module.exports = {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationOTPSchema,
};

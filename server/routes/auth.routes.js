const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/admin/login', authLimiter, validate(adminLoginSchema), authController.adminLogin);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.get('/check-availability', authController.checkAvailability);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;

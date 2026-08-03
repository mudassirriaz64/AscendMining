const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { submitWalletChangeRequestSchema } = require('../validators/walletChangeRequest.validator');

// Submit a wallet address change request (requires admin approval)
router.post(
  '/request-change',
  authMiddleware,
  validate(submitWalletChangeRequestSchema),
  walletController.submitWalletChangeRequest
);

// Get current user's wallet change request history
router.get('/change-requests', authMiddleware, walletController.getMyWalletChangeRequests);

module.exports = router;

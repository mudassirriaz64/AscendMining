const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/update', authMiddleware, walletController.updateWalletAddress);

module.exports = router;

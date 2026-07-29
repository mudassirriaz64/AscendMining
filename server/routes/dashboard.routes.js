const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/summary', authMiddleware, dashboardController.getDashboardSummary);
router.get('/deposits', authMiddleware, dashboardController.getMyDeposits);
router.get('/transactions', authMiddleware, dashboardController.getMyTransactions);
router.get('/referrals', authMiddleware, dashboardController.getMyReferrals);

module.exports = router;

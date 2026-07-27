const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/request', authMiddleware, withdrawalController.requestWithdrawal);
router.get('/', authMiddleware, withdrawalController.listWithdrawals);

module.exports = router;

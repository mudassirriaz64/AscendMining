const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requestWithdrawalSchema } = require('../validators/withdrawal.validator');

router.post('/request', authMiddleware, validate(requestWithdrawalSchema), withdrawalController.requestWithdrawal);
router.get('/', authMiddleware, withdrawalController.listWithdrawals);

module.exports = router;

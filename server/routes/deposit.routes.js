const express = require('express');
const router = express.Router();
const depositController = require('../controllers/deposit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { submitDepositSchema } = require('../validators/deposit.validator');

router.post('/', authMiddleware, validate(submitDepositSchema), depositController.submitDeposit);

module.exports = router;

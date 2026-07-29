const express = require('express');
const router = express.Router();
const depositController = require('../controllers/deposit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, depositController.submitDeposit);

module.exports = router;

const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethod.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, paymentMethodController.listPaymentMethods);

module.exports = router;

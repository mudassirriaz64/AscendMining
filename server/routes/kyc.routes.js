const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { submitKYCSchema } = require('../validators/kyc.validator');

router.post('/submit', authMiddleware, validate(submitKYCSchema), kycController.submitKYC);
router.get('/status', authMiddleware, kycController.getKYCStatus);

module.exports = router;

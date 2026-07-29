const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);

router.post('/submit', kycController.submitKYC);
router.get('/status', kycController.getKYCStatus);

module.exports = router;

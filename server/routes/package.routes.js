const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', packageController.listPackages);
router.post('/purchase', authMiddleware, packageController.purchasePackage);

module.exports = router;

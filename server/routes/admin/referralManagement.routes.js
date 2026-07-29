const express = require('express');
const router = express.Router();
const referralManagementController = require('../../controllers/admin/referralManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/settings', referralManagementController.getReferralSettings);
router.put('/settings', referralManagementController.updateReferralSettings);
router.get('/records', referralManagementController.getGlobalReferralRecords);

module.exports = router;

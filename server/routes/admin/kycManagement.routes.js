const express = require('express');
const router = express.Router();
const kycManagementController = require('../../controllers/admin/kycManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/', kycManagementController.getPendingKYC);
router.put('/:userId/approve', kycManagementController.approveKYC);
router.put('/:userId/reject', kycManagementController.rejectKYC);

module.exports = router;

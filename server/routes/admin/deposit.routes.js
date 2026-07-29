const express = require('express');
const router = express.Router();
const depositController = require('../../controllers/admin/deposit.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.get('/', auth, requireRole('admin', 'support_agent'), depositController.getPendingDeposits);
router.post('/:id/approve', auth, requireRole('admin'), depositController.approveDeposit);
router.post('/:id/reject', auth, requireRole('admin', 'support_agent'), depositController.rejectDeposit);

module.exports = router;

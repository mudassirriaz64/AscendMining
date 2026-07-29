const express = require('express');
const router = express.Router();
const withdrawalManagementController = require('../../controllers/admin/withdrawalManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { rejectWithdrawalSchema } = require('../../validators/admin/withdrawal.validator');

router.use(auth);

// Both admin and support_agent can view pending withdrawals
router.get('/pending', requireRole('admin', 'support_agent'), withdrawalManagementController.getPendingWithdrawals);

// Both can view all withdrawals
router.get('/', requireRole('admin', 'support_agent'), withdrawalManagementController.getAllWithdrawals);

// Only admin can approve withdrawals
router.post('/:id/approve', requireRole('admin'), withdrawalManagementController.approveWithdrawal);

// Both can reject (support might reject invalid ones)
router.post('/:id/reject', requireRole('admin', 'support_agent'), validate(rejectWithdrawalSchema), withdrawalManagementController.rejectWithdrawal);

module.exports = router;

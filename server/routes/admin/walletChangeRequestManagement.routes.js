const express = require('express');
const router = express.Router();
const walletChangeController = require('../../controllers/admin/walletChangeRequestManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { rejectWalletChangeSchema } = require('../../validators/admin/walletChangeRequest.validator');

router.use(auth);

// Both admin and support_agent can view all / pending requests
router.get('/', requireRole('admin', 'support_agent'), walletChangeController.getRequests);

// Only admin can approve
router.post('/:id/approve', requireRole('admin'), walletChangeController.approveRequest);

// Both can reject (support may flag invalid requests)
router.post('/:id/reject', requireRole('admin', 'support_agent'), validate(rejectWalletChangeSchema), walletChangeController.rejectRequest);

module.exports = router;

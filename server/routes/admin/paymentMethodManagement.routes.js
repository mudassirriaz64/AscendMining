const express = require('express');
const router = express.Router();
const paymentMethodManagementController = require('../../controllers/admin/paymentMethodManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/', paymentMethodManagementController.getAllPaymentMethods);
router.post('/', paymentMethodManagementController.createPaymentMethod);
router.put('/:id', paymentMethodManagementController.updatePaymentMethod);
router.delete('/:id', paymentMethodManagementController.deletePaymentMethod);
router.patch('/:id/toggle-status', paymentMethodManagementController.toggleStatus);

module.exports = router;

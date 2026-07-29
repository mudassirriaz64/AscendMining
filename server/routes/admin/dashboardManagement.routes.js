const express = require('express');
const router = express.Router();
const dashboardManagementController = require('../../controllers/admin/dashboardManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/stats', dashboardManagementController.getDashboardStats);

module.exports = router;

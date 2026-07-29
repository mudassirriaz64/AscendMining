const express = require('express');
const router = express.Router();
const userPackageManagementController = require('../../controllers/admin/userPackageManagement.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/', userPackageManagementController.getUserPackages);
router.put('/:id', userPackageManagementController.updateUserPackage);

module.exports = router;

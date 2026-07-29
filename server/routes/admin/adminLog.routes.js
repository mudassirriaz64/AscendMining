const express = require('express');
const router = express.Router();
const adminLogController = require('../../controllers/admin/adminLog.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.get('/', auth, requireRole('admin'), adminLogController.getAuditLogs);

module.exports = router;

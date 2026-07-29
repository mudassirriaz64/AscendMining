const express = require('express');
const router = express.Router();
const miningSettingsController = require('../../controllers/admin/miningSettings.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin'));

router.get('/', miningSettingsController.getMiningSettings);
router.put('/', miningSettingsController.updateMiningSettings);

module.exports = router;

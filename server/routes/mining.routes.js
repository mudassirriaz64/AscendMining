const express = require('express');
const router = express.Router();
const miningController = require('../controllers/mining.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/claim/:userPackageId', authMiddleware, miningController.claimMiningReward);
router.get('/tracks', authMiddleware, miningController.getUserMiningTracks);

module.exports = router;

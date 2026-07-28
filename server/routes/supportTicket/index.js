const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('../../controllers/supportTicket.controller');

router.post('/escalate', auth, requireRole('investor'), controller.escalate);
router.get('/', auth, requireRole('investor'), controller.getMyTickets);

module.exports = router;

const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('../../controllers/supportChat.controller');

router.get('/', auth, requireRole('admin', 'support_agent'), controller.getConversations);
router.get('/waiting', auth, requireRole('admin', 'support_agent'), controller.getWaiting);
router.get('/:id', auth, requireRole('admin', 'support_agent'), controller.openConversation);
router.delete('/sessions/:sessionId', auth, requireRole('admin', 'support_agent'), controller.adminDeleteSession);

module.exports = router;

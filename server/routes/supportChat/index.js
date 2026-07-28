const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('../../controllers/supportChat.controller');

router.get('/me', auth, requireRole('investor'), controller.getMyConversation);
router.post('/message', auth, requireRole('investor', 'admin', 'support_agent'), controller.sendMessage);

router.get('/sessions', auth, requireRole('investor'), controller.getMyConversation);
router.post('/sessions', auth, requireRole('investor'), controller.createSession);
router.delete('/sessions/:sessionId', auth, requireRole('investor'), controller.deleteSession);
router.patch('/sessions/:sessionId/close', auth, requireRole('investor'), controller.closeSession);
router.get('/sessions/:sessionId/messages', auth, requireRole('investor'), controller.getMySessionMessages);

module.exports = router;

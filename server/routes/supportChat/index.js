const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('../../controllers/supportChat.controller');

router.post('/guest-conversations', controller.createGuestConversation);
const uploadMiddleware = require('../../middlewares/upload.middleware');

router.get('/me', auth, requireRole('investor'), controller.getMyConversation);
router.post('/message', auth, requireRole('investor', 'admin', 'support_agent'), controller.sendMessage);
router.post('/upload', auth, requireRole('investor'), uploadMiddleware, controller.uploadAttachment);

router.get('/sessions', auth, requireRole('investor'), controller.getMyConversation);
router.post('/sessions', auth, requireRole('investor'), controller.createSession);
router.delete('/sessions/:sessionId', auth, requireRole('investor'), controller.deleteSession);
router.delete('/', auth, requireRole('investor'), controller.deleteConversation);
router.patch('/sessions/:sessionId/close', auth, requireRole('investor'), controller.closeSession);
router.get('/sessions/:sessionId/messages', auth, requireRole('investor'), controller.getMySessionMessages);

module.exports = router;

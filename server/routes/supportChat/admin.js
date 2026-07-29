const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const controller = require('../../controllers/supportChat.controller');
const uploadMiddleware = require('../../middlewares/upload.middleware');

router.get('/', auth, requireRole('admin', 'support_agent'), controller.getConversations);
router.get('/waiting', auth, requireRole('admin', 'support_agent'), controller.getWaiting);
router.get('/:id', auth, requireRole('admin', 'support_agent'), controller.openConversation);
router.post('/:id/upload', auth, requireRole('admin', 'support_agent'), uploadMiddleware, controller.uploadAttachment);
router.delete('/sessions/:sessionId', auth, requireRole('admin', 'support_agent'), controller.adminDeleteSession);
router.post('/:id/sessions', auth, requireRole('admin', 'support_agent'), controller.adminCreateSession);
router.delete('/:id', auth, requireRole('admin', 'support_agent'), controller.adminDeleteConversation);

module.exports = router;

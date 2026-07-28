const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const supportChatController = require('../../controllers/supportChat.controller');

// Admin: Get paginated list of all conversations
router.get('/', authMiddleware, requireRole('admin', 'support_agent'), supportChatController.getConversations);

// Admin: Get messages for a specific conversation
router.get('/:conversationId/messages', authMiddleware, requireRole('admin', 'support_agent'), supportChatController.getConversationMessages);

// Admin: Reply to a conversation
router.post('/:conversationId/reply', authMiddleware, requireRole('admin', 'support_agent'), supportChatController.replyToConversation);

module.exports = router;

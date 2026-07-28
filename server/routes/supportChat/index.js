const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const supportChatController = require('../../controllers/supportChat.controller');

// Investor: Get or create own conversation thread + messages
router.get('/', authMiddleware, supportChatController.getMyConversation);

// Investor: Send message (REST fallback; real-time via Socket.IO)
router.post('/message', authMiddleware, supportChatController.sendMessage);

module.exports = router;

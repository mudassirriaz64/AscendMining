const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const supportChatController = require('../../controllers/supportChat.controller');

// Investor: Get active session + messages (initial load)
router.get('/', authMiddleware, supportChatController.getActiveSession);

// Investor: Send message (REST fallback; real-time via Socket.IO)
router.post('/message', authMiddleware, supportChatController.sendMessage);

// Investor: Get list of all sessions (sidebar)
router.get('/sessions', authMiddleware, supportChatController.getMySessions);

// Investor: Start a new chat session
router.post('/sessions', authMiddleware, supportChatController.startSession);

// Investor: Get messages for a specific session
router.get('/sessions/:sessionId/messages', authMiddleware, supportChatController.getSessionMessages);

// Investor: Close/resolve a session
router.post('/sessions/:sessionId/close', authMiddleware, supportChatController.closeSession);

module.exports = router;

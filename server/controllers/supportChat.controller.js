const supportChatService = require('../services/supportChat.service');

// ── Investor session-based endpoints ───────────────────────────────────────

/**
 * GET /api/support/chat/sessions
 * Investor: Get list of all their chat sessions (sidebar)
 */
const getMySessions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await supportChatService.getUserSessions(req.user.id, {
      skip: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50),
      limit: parseInt(limit) || 50,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/support/chat/sessions
 * Investor: Start a new chat session
 */
const startSession = async (req, res, next) => {
  try {
    const result = await supportChatService.startNewSession(req.user.id);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/support/chat/sessions/:sessionId/messages
 * Investor: Get messages for a specific session
 */
const getSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await supportChatService.getSessionMessages(req.user.id, sessionId);
    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found.', status: 404 } });
    }
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/support/chat/sessions/:sessionId/close
 * Investor: Close/resolve a session
 */
const closeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await supportChatService.closeSession(req.user.id, sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found.', status: 404 } });
    }
    return res.status(200).json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/support/chat
 * Investor: Get or create active session + messages (backwards compat / initial load)
 */
const getActiveSession = async (req, res, next) => {
  try {
    const result = await supportChatService.getOrCreateActiveSession(req.user.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/support/chat/message
 * Investor: Send a message (REST fallback)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { body, sessionId } = req.body;
    const result = await supportChatService.sendUserMessage(req.user.id, body, sessionId);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── Admin endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/admin/support/chat
 * Admin: Get paginated list of all conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const result = await supportChatService.getConversations({ page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/support/chat/:conversationId/messages
 * Admin: Get messages for a specific conversation (flat thread with session dividers)
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await supportChatService.getConversationMessages(
      conversationId,
      req.user.id,
      req.user.role
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/support/chat/:conversationId/reply
 * Admin/Agent: Send reply in a conversation
 */
const replyToConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { body } = req.body;
    const message = await supportChatService.sendAgentMessage(
      req.user.id,
      req.user.role,
      conversationId,
      body
    );
    return res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMySessions,
  startSession,
  getSessionMessages,
  closeSession,
  getActiveSession,
  sendMessage,
  getConversations,
  getConversationMessages,
  replyToConversation,
};

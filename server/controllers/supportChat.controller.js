const supportChatService = require('../services/supportChat.service');

/**
 * GET /api/support/chat
 * Investor: Get or create their conversation thread + messages
 */
const getMyConversation = async (req, res, next) => {
  try {
    const { conversation, messages } = await supportChatService.getOrCreateConversation(req.user.id);
    return res.status(200).json({ success: true, data: { conversation, messages } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/support/chat/message
 * Investor: Send a message
 */
const sendMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    const { message, conversationId } = await supportChatService.sendUserMessage(req.user.id, body);
    return res.status(201).json({ success: true, data: { message, conversationId } });
  } catch (err) {
    next(err);
  }
};

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
 * Admin: Get messages for a specific conversation
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const messages = await supportChatService.getConversationMessages(
      conversationId,
      req.user.id,
      req.user.role
    );
    return res.status(200).json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/support/chat/:conversationId/reply
 * Admin/Agent: Send reply message in a conversation
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
  getMyConversation,
  sendMessage,
  getConversations,
  getConversationMessages,
  replyToConversation,
};

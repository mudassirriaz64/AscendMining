const supportChatService = require('../services/supportChat.service');

const pagination = (query, fallback = 50) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || fallback, 1), 100),
});

const getMyConversation = async (req, res, next) => {
  try {
    const data = await supportChatService.getMyConversation(req.user.id, {
      ...pagination(req.query),
      markRead: req.query.opened === 'true',
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getMySessionMessages = async (req, res, next) => {
  try {
    const data = await supportChatService.getMySessionMessages(req.user.id, req.params.sessionId, pagination(req.query, 100));
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getOrCreateConversation(req.user.id);
    const session = await supportChatService.createSession(conversation._id, req.body.title);
    res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getConversationByUserId(req.user.id);
    if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    await supportChatService.deleteSession(req.params.sessionId, conversation._id);
    res.json({ success: true, data: { message: 'Session deleted.' } });
  } catch (error) { next(error); }
};

const sendMessage = async (req, res, next) => {
  try {
    const isInvestor = req.user.role === 'investor';
    let conversationId;
    let sessionId = req.body.sessionId || null;

    if (isInvestor) {
      const conversation = await supportChatService.getOrCreateConversation(req.user.id);
      conversationId = conversation._id;
      if (!sessionId) {
        const sessions = await supportChatService.getSessions(conversationId);
        sessionId = sessions.length > 0 ? sessions[0]._id : null;
      }
    } else {
      conversationId = req.body.conversationId;
      sessionId = req.body.sessionId || null;
    }

    const result = await supportChatService.sendMessage({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      body: req.body.body,
      sessionId,
    });
    req.app.get('supportNamespace')?.to(`conversation:${conversationId}`).emit('message:new', result);
    if (result.startedWaiting) {
      req.app.get('supportNamespace')?.to('admin-alerts').emit('alarm:trigger', {
        conversationId: conversationId.toString(),
        awaitingAgentSince: result.conversation.awaitingAgentSince,
      });
    } else if (!isInvestor) {
      req.app.get('supportNamespace')?.to('admin-alerts').emit('alarm:clear', { conversationId });
    }
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getConversations = async (req, res, next) => {
  try {
    res.json({ success: true, data: await supportChatService.getConversations(pagination(req.query, 30)) });
  } catch (error) { next(error); }
};

const openConversation = async (req, res, next) => {
  try {
    const data = await supportChatService.openConversation(req.params.id, req.user.id, pagination(req.query, 100));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    req.app.get('supportNamespace')?.to('admin-alerts').emit('alarm:clear', { conversationId: req.params.id });
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getWaiting = async (req, res, next) => {
  try {
    const conversations = await supportChatService.getWaitingConversations();
    res.json({ success: true, data: { conversations, count: conversations.length } });
  } catch (error) { next(error); }
};

const adminDeleteSession = async (req, res, next) => {
  try {
    await supportChatService.adminDeleteSession(req.params.sessionId);
    res.json({ success: true, data: { message: 'Session deleted.' } });
  } catch (error) { next(error); }
};

const closeSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getConversationByUserId(req.user.id);
    if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    const session = await supportChatService.closeSession(req.params.sessionId, req.user.id, req.body.reason || 'user_close');
    res.json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

module.exports = {
  getMyConversation,
  getMySessionMessages,
  createSession,
  deleteSession,
  closeSession,
  sendMessage,
  getConversations,
  openConversation,
  getWaiting,
  adminDeleteSession,
};

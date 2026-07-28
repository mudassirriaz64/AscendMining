const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/conversationMessage.repository');
const sessionRepo = require('../repositories/conversationSession.repository');

const SLA_MS = 30 * 60 * 1000;
const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

const getOrCreateConversation = (userId) => conversationRepo.getOrCreateByUserId(userId);
const getConversationByUserId = (userId) => conversationRepo.findByUserId(userId);

const serializeConversation = (conversation) => {
  const value = conversation?.toObject ? conversation.toObject() : conversation;
  if (!value) return value;
  return {
    ...value,
    escalationAvailable: Boolean(
      value.awaitingAgentSince && Date.now() - new Date(value.awaitingAgentSince).getTime() >= SLA_MS
    ),
  };
};

const createSession = async (conversationId, title) => {
  const count = await sessionRepo.countActiveByConversationId(conversationId);
  return sessionRepo.create({
    conversationId,
    title: title || `Session ${count + 1}`,
  });
};

const getSessions = (conversationId) =>
  sessionRepo.findActiveByConversationId(conversationId);

const getSessionsAll = (conversationId) =>
  require('../models/ConversationSession')
    .find({ conversationId })
    .sort({ createdAt: -1 })
    .lean();

const closeSession = async (sessionId, userId, closeReason = 'user_close') => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    const err = new Error('Session not found.');
    err.statusCode = 404;
    throw err;
  }
  return sessionRepo.closeSession(sessionId, closeReason);
};

const deleteSession = async (sessionId, conversationId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    const err = new Error('Session not found.');
    err.statusCode = 404;
    throw err;
  }
  if (session.conversationId.toString() !== conversationId.toString()) {
    const err = new Error('Forbidden.');
    err.statusCode = 403;
    throw err;
  }
  await messageRepo.deleteBySessionId(sessionId);
  return sessionRepo.closeSession(sessionId, 'admin');
};

const isSessionClosed = (session) => session && session.closedAt !== null;

const sendMessage = async ({ conversationId, senderId, senderRole, body, sessionId }) => {
  let trimmedBody;
  if (Array.isArray(body)) {
    trimmedBody = body.join('');
  } else if (typeof body === 'string') {
    trimmedBody = body.trim();
  } else if (body != null) {
    trimmedBody = String(body).trim();
  } else {
    trimmedBody = '';
  }
  if (!trimmedBody) {
    const error = new Error('Message body is required.');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.statusCode = 404;
    throw error;
  }

  let activeSessionId = sessionId;
  let sessionIsClosed = false;

  if (activeSessionId) {
    const session = await sessionRepo.findById(activeSessionId);
    sessionIsClosed = isSessionClosed(session);
  } else {
    const latest = await sessionRepo.findLatestActiveSession(conversationId);
    if (latest) {
      activeSessionId = latest._id;
    }
  }

  if (!activeSessionId || sessionIsClosed) {
    const newSession = await createSession(conversationId);
    activeSessionId = newSession._id;
  }

  const now = new Date();
  const message = await messageRepo.create({
    conversationId,
    sessionId: activeSessionId,
    senderId,
    senderRole,
    body: trimmedBody,
  });
  const isInvestor = senderRole === 'investor';
  const startedWaitingConversation = isInvestor
    ? await conversationRepo.markAwaitingIfNull(conversationId, now)
    : null;
  const startedWaiting = Boolean(startedWaitingConversation);
  const update = {
    lastMessageAt: now,
    lastMessageBy: isInvestor ? 'user' : 'agent',
    lastMessagePreview: trimmedBody.slice(0, 100),
    unreadByAdmin: isInvestor,
    unreadByUser: !isInvestor,
  };
  if (!isInvestor) update.awaitingAgentSince = null;

  const updatedConversation = await conversationRepo.updateById(conversationId, update);
  return { message, conversation: serializeConversation(updatedConversation), startedWaiting, sessionId: activeSessionId };
};

const getMyConversation = async (userId, { page = 1, limit = 50, markRead = false } = {}) => {
  const conversation = await getOrCreateConversation(userId);
  const sessions = await sessionRepo.findActiveByConversationId(conversation._id);

  if (sessions.length === 0) {
    const newSession = await createSession(conversation._id);
    sessions.unshift({ ...newSession.toObject(), _id: newSession._id });
  }

  const activeSessionId = sessions[0]._id;
  const messages = await messageRepo.findBySessionId(activeSessionId, {
    skip: (page - 1) * limit,
    limit,
  });

  if (markRead) {
    await Promise.all([
      messageRepo.markReadByConversation(conversation._id, 'investor'),
      conversationRepo.updateById(conversation._id, { unreadByUser: false }),
    ]);
  }
  return {
    conversation: serializeConversation({ ...conversation.toObject(), unreadByUser: markRead ? false : conversation.unreadByUser }),
    sessions,
    activeSessionId,
    messages,
    page,
  };
};

const getMySessionMessages = async (userId, sessionId, { page = 1, limit = 100 } = {}) => {
  const conversation = await getConversationByUserId(userId);
  if (!conversation) return { messages: [], session: null };

  const session = await sessionRepo.findById(sessionId);
  if (!session || session.conversationId.toString() !== conversation._id.toString()) {
    return { messages: [], session: null };
  }

  const messages = await messageRepo.findBySessionId(sessionId, {
    skip: (page - 1) * limit,
    limit,
  });
  return { messages, session };
};

const markConversationOpened = async (conversationId, byAgentId) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) return null;
  const [updated] = await Promise.all([
    conversationRepo.updateById(conversationId, {
      awaitingAgentSince: null,
      unreadByAdmin: false,
      assignedAgent: byAgentId,
    }),
    messageRepo.markReadByConversation(conversationId, 'admin'),
  ]);
  return updated;
};

const getConversations = async ({ page = 1, limit = 30 } = {}) => {
  const skip = (page - 1) * limit;
  const [conversations, total] = await Promise.all([
    conversationRepo.findAllUrgentFirst({ skip, limit }),
    conversationRepo.countAll(),
  ]);
  return { conversations: conversations.map(serializeConversation), total, page, totalPages: Math.ceil(total / limit) };
};

const openConversation = async (conversationId, agentId, { page = 1, limit = 200 } = {}) => {
  const conversation = await markConversationOpened(conversationId, agentId);
  if (!conversation) return null;

  const sessions = await getSessionsAll(conversationId);
  const allMessages = await messageRepo.findByConversationId(conversationId, { skip: 0, limit: 500 });
  return {
    conversation: serializeConversation(conversation),
    sessions,
    messages: allMessages.reverse(),
    page,
  };
};

const getWaitingConversations = async () => {
  const conversations = await conversationRepo.findAwaiting();
  return conversations.map(serializeConversation);
};

const adminDeleteSession = async (sessionId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    const err = new Error('Session not found.');
    err.statusCode = 404;
    throw err;
  }
  await messageRepo.deleteBySessionId(sessionId);
  return sessionRepo.closeSession(sessionId, 'admin');
};

module.exports = {
  SLA_MS,
  SESSION_INACTIVITY_MS,
  getOrCreateConversation,
  getConversationByUserId,
  sendMessage,
  getMyConversation,
  getMySessionMessages,
  createSession,
  getSessions,
  getSessionsAll,
  closeSession,
  deleteSession,
  markConversationOpened,
  getConversations,
  openConversation,
  getWaitingConversations,
  adminDeleteSession,
};

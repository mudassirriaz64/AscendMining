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
    _id: value._id ? value._id.toString() : value._id,
    userId: value.userId ? value.userId.toString() : value.userId,
    assignedAgent: value.assignedAgent ? value.assignedAgent.toString() : value.assignedAgent,
    escalationAvailable: Boolean(
      value.awaitingAgentSince && Date.now() - new Date(value.awaitingAgentSince).getTime() >= SLA_MS
    ),
  };
};

const serializeSession = (session) => {
  const value = session?.toObject ? session.toObject() : session;
  if (!value) return value;
  return {
    ...value,
    _id: value._id ? value._id.toString() : value._id,
    conversationId: value.conversationId ? value.conversationId.toString() : value.conversationId,
  };
};

const serializeMessage = (msg) => {
  const value = msg?.toObject ? msg.toObject() : msg;
  if (!value) return value;
  return {
    ...value,
    _id: value._id ? value._id.toString() : value._id,
    conversationId: value.conversationId ? value.conversationId.toString() : value.conversationId,
    sessionId: value.sessionId ? value.sessionId.toString() : value.sessionId,
    senderId: value.senderId ? value.senderId.toString() : value.senderId,
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

const getSessionsAll = (conversationId, filterHiddenAdmin = false) => {
  const query = { conversationId };
  if (filterHiddenAdmin) {
    query.hiddenFromAdmin = { $ne: true };
  }
  return require('../models/ConversationSession')
    .find(query)
    .sort({ createdAt: -1 })
    .lean();
};

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
  session.hiddenFromUser = true;
  await session.save();
  return session;
};

const isSessionClosed = (session) => session && session.closedAt !== null;

const sendMessage = async ({
  conversationId,
  senderId,
  senderRole,
  body,
  sessionId,
  attachmentUrl = null,
  attachmentPublicId = null,
  attachmentFileName = null,
  attachmentType = null,
  messageId = null,
}) => {
  let trimmedBody = '';
  if (Array.isArray(body)) {
    trimmedBody = body.join('');
  } else if (typeof body === 'string') {
    trimmedBody = body.trim();
  } else if (body != null) {
    trimmedBody = String(body).trim();
  }

  if (!trimmedBody && !attachmentUrl) {
    const error = new Error('Message body or attachment is required.');
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
  const messageData = {
    conversationId,
    sessionId: activeSessionId,
    senderId,
    senderRole,
    body: trimmedBody || undefined,
    attachmentUrl,
    attachmentPublicId,
    attachmentFileName,
    attachmentType,
  };
  if (messageId) {
    messageData._id = messageId;
  }

  const message = await messageRepo.create(messageData);
  const isInvestor = senderRole === 'investor';
  const startedWaitingConversation = isInvestor
    ? await conversationRepo.markAwaitingIfNull(conversationId, now)
    : null;
  const startedWaiting = Boolean(startedWaitingConversation);

  let previewText = '';
  if (trimmedBody) {
    previewText = trimmedBody.slice(0, 100);
  } else if (attachmentUrl) {
    previewText = attachmentType === 'image' ? '📷 Photo' : '📄 Document';
  }

  const update = {
    lastMessageAt: now,
    lastMessageBy: isInvestor ? 'user' : 'agent',
    lastMessagePreview: previewText,
    unreadByAdmin: isInvestor,
    unreadByUser: !isInvestor,
  };
  if (!isInvestor) {
    update.awaitingAgentSince = null;
    try {
      const SupportTicket = require('../models/SupportTicket');
      await SupportTicket.updateMany(
        { conversationId, status: 'open' },
        { $set: { status: 'in_progress' } }
      );
    } catch (err) {
      console.error('[SLA] Failed to update associated ticket status:', err);
    }
  }

  if (isInvestor) {
    update.hiddenFromAdmin = false;
  } else {
    update.hiddenFromUser = false;
  }

  // Also unhide the session itself for the recipient if it was hidden
  const session = await sessionRepo.findById(activeSessionId);
  if (session) {
    let sessionUpdated = false;
    if (isInvestor && session.hiddenFromAdmin) {
      session.hiddenFromAdmin = false;
      sessionUpdated = true;
    } else if (!isInvestor && session.hiddenFromUser) {
      session.hiddenFromUser = false;
      sessionUpdated = true;
    }
    if (sessionUpdated) {
      await session.save();
    }
  }

  const updatedConversation = await conversationRepo.updateById(conversationId, update);
  return {
    message: serializeMessage(message),
    conversation: serializeConversation(updatedConversation),
    startedWaiting,
    sessionId: activeSessionId.toString(),
  };
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
    sessions: sessions.map(serializeSession),
    activeSessionId: activeSessionId.toString(),
    messages: messages.map(serializeMessage),
    page,
  };
};

const getMySessionMessages = async (userId, sessionId, { page = 1, limit = 100 } = {}) => {
  const conversation = await getConversationByUserId(userId);
  if (!conversation) return { messages: [], session: null };

  const session = await sessionRepo.findById(sessionId);
  if (!session || session.conversationId.toString() !== conversation._id.toString() || session.hiddenFromUser) {
    return { messages: [], session: null };
  }

  const messages = await messageRepo.findBySessionId(sessionId, {
    skip: (page - 1) * limit,
    limit,
  });
  return { messages: messages.map(serializeMessage), session: serializeSession(session) };
};

const markConversationOpened = async (conversationId, byAgentId) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) return null;

  try {
    const SupportTicket = require('../models/SupportTicket');
    await SupportTicket.updateMany(
      { conversationId, status: 'open' },
      { $set: { status: 'in_progress' } }
    );
  } catch (err) {
    console.error('[SLA] Failed to update ticket status on open:', err);
  }

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
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) return null;
  const isNewAssignment = !conversation.assignedAgent;

  const updatedConversation = await markConversationOpened(conversationId, agentId);

  let systemMessage = null;
  if (isNewAssignment) {
    const latestSession = await sessionRepo.findLatestActiveSession(conversationId);
    let activeSessionId = latestSession ? latestSession._id : null;
    if (!activeSessionId) {
      const newSession = await createSession(conversationId);
      activeSessionId = newSession._id;
    }
    systemMessage = await messageRepo.create({
      conversationId,
      sessionId: activeSessionId,
      senderId: agentId,
      senderRole: 'admin',
      body: '[SYSTEM] Agent joined the conversation',
    });
  }

  const sessions = await getSessionsAll(conversationId, true);
  const activeSessionIds = sessions.map(s => s._id.toString());
  const allMessages = await messageRepo.findByConversationId(conversationId, { skip: 0, limit: 500 });
  const filteredMessages = allMessages.filter(msg => msg.sessionId && activeSessionIds.includes(msg.sessionId.toString()));
  return {
    conversation: serializeConversation(updatedConversation),
    sessions: sessions.map(serializeSession),
    messages: filteredMessages.map(serializeMessage).reverse(),
    page,
    systemMessage: systemMessage ? serializeMessage(systemMessage) : null,
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
  session.hiddenFromAdmin = true;
  await session.save();
  return session;
};

const adminCreateSession = async (conversationId, title) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }
  return createSession(conversationId, title);
};

const adminDeleteConversation = async (conversationId) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }
  conversation.hiddenFromAdmin = true;
  await conversation.save();
  return conversation;
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
  adminCreateSession,
  adminDeleteConversation,
};

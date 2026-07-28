const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/conversationMessage.repository');
const sessionRepo = require('../repositories/chatSession.repository');

// ── Investor session-based methods ─────────────────────────────────────────

/**
 * Get or create the user's active session. Returns session + its messages.
 * If no active session exists, creates a new one.
 */
const getOrCreateActiveSession = async (userId) => {
  const conversation = await conversationRepo.findOrCreate(userId);
  let session = await sessionRepo.findActiveByUserId(userId);

  if (!session) {
    session = await sessionRepo.create({
      conversationId: conversation._id,
      userId,
    });
  }

  const messages = await messageRepo.findBySessionId(session._id);
  // Mark admin messages as read
  await messageRepo.markReadByConversation(conversation._id, 'investor');
  await conversationRepo.updateById(conversation._id, { unreadByUser: false });

  return { session, messages };
};

/**
 * User starts a new chat session.
 */
const startNewSession = async (userId) => {
  const conversation = await conversationRepo.findOrCreate(userId);

  // Close any existing active session
  const existing = await sessionRepo.findActiveByUserId(userId);
  if (existing) {
    await sessionRepo.updateById(existing._id, {
      isActive: false,
      status: 'resolved',
    });
  }

  const session = await sessionRepo.create({
    conversationId: conversation._id,
    userId,
  });

  return { session, messages: [] };
};

/**
 * Get user's session list for sidebar.
 */
const getUserSessions = async (userId, { skip = 0, limit = 50 } = {}) => {
  const sessions = await sessionRepo.findByUserId(userId, { skip, limit });
  const total = await sessionRepo.countByUserId(userId);
  return { sessions, total };
};

/**
 * Get messages for a specific session.
 */
const getSessionMessages = async (userId, sessionId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) return null;
  if (session.userId.toString() !== userId.toString()) return null;

  const messages = await messageRepo.findBySessionId(sessionId);

  // Mark admin messages as read if this is the active session
  if (session.isActive) {
    const conversation = await conversationRepo.findByUserId(userId);
    if (conversation) {
      await messageRepo.markReadByConversation(conversation._id, 'investor');
      await conversationRepo.updateById(conversation._id, { unreadByUser: false });
    }
  }

  return { session, messages };
};

/**
 * Close/resolve a session.
 */
const closeSession = async (userId, sessionId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) return null;
  if (session.userId.toString() !== userId.toString()) return null;

  const updated = await sessionRepo.updateById(sessionId, {
    isActive: false,
    status: 'resolved',
  });

  return updated;
};

/**
 * Send a message as the investor into a session.
 */
const sendUserMessage = async (userId, body, sessionId) => {
  const conversation = await conversationRepo.findOrCreate(userId);

  // Determine which session to use
  let session;
  if (sessionId) {
    session = await sessionRepo.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new Error('Invalid session.');
    }
  } else {
    // Use active session or create one
    session = await sessionRepo.findActiveByUserId(userId);
    if (!session) {
      session = await sessionRepo.create({
        conversationId: conversation._id,
        userId,
      });
    }
  }

  const message = await messageRepo.createMessage({
    conversationId: conversation._id,
    sessionId: session._id,
    senderId: userId,
    senderRole: 'investor',
    body,
  });

  // Update session metadata
  const preview = body.substring(0, 80);
  await sessionRepo.updateById(session._id, {
    lastMessageAt: new Date(),
    lastMessagePreview: session.messageCount === 0 ? preview : session.lastMessagePreview,
  });
  await sessionRepo.incrementMessageCount(session._id);

  // Update conversation metadata
  const updateData = {
    lastMessageAt: new Date(),
    lastMessageBy: 'user',
    lastMessagePreview: preview,
    unreadByAdmin: true,
  };

  if (!conversation.awaitingAgentSince) {
    updateData.awaitingAgentSince = new Date();
  }

  await conversationRepo.updateById(conversation._id, updateData);

  return { message, conversationId: conversation._id, sessionId: session._id };
};

// ── Admin methods (flat thread per user) ───────────────────────────────────

/**
 * Send a message as an agent/admin into a conversation.
 * Attaches it to the user's latest active session.
 */
const sendAgentMessage = async (agentId, agentRole, conversationId, body) => {
  // Find the user's active session, or fallback to latest session
  const Conversation = require('../models/Conversation');
  const convoDoc = await Conversation.findById(conversationId).select('userId');
  if (!convoDoc) throw new Error('Conversation not found.');

  let session = await sessionRepo.findActiveByUserId(convoDoc.userId);
  if (!session) {
    // Fallback: get latest session
    const sessions = await sessionRepo.findByUserId(convoDoc.userId, { limit: 1 });
    session = sessions[0];
  }

  const message = await messageRepo.createMessage({
    conversationId,
    sessionId: session ? session._id : null,
    senderId: agentId,
    senderRole: agentRole,
    body,
  });

  // Update conversation metadata (clear SLA timer)
  await conversationRepo.updateById(conversationId, {
    lastMessageAt: new Date(),
    lastMessageBy: 'agent',
    lastMessagePreview: body.substring(0, 100),
    unreadByUser: true,
    unreadByAdmin: false,
    awaitingAgentSince: null,
  });

  // Update session metadata
  if (session) {
    const preview = body.substring(0, 80);
    await sessionRepo.updateById(session._id, {
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
    });
    await sessionRepo.incrementMessageCount(session._id);
  }

  return message;
};

/**
 * Admin: get paginated list of all conversations
 */
const getConversations = async ({ page = 1, limit = 30 } = {}) => {
  const skip = (page - 1) * limit;
  const [conversations, total] = await Promise.all([
    conversationRepo.findAll({ skip, limit }),
    conversationRepo.countAll(),
  ]);
  return { conversations, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Admin: get all messages for a specific conversation (flat thread with session dividers)
 */
const getConversationMessages = async (conversationId, agentId, agentRole) => {
  const messages = await messageRepo.findByConversationId(conversationId, { limit: 500 });

  // Get sessions for this conversation (for dividers)
  const ChatSession = require('../models/ChatSession');
  const sessions = await ChatSession.find({ conversationId }).sort({ startedAt: 1 });

  // Mark investor messages as read when agent opens conversation
  await messageRepo.markReadByConversation(conversationId, agentRole);
  await conversationRepo.updateById(conversationId, { unreadByAdmin: false });

  return { messages, sessions };
};

module.exports = {
  getOrCreateActiveSession,
  startNewSession,
  getUserSessions,
  getSessionMessages,
  closeSession,
  sendUserMessage,
  sendAgentMessage,
  getConversations,
  getConversationMessages,
};

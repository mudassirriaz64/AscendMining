const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/conversationMessage.repository');

/**
 * Get or create the user's conversation thread. Returns conversation + recent messages.
 */
const getOrCreateConversation = async (userId) => {
  const conversation = await conversationRepo.findOrCreate(userId);
  const messages = await messageRepo.findByConversationId(conversation._id, { limit: 50 });
  // Mark admin messages as read when investor opens the chat
  await messageRepo.markReadByConversation(conversation._id, 'investor');
  await conversationRepo.updateById(conversation._id, { unreadByUser: false });
  return { conversation, messages };
};

/**
 * Send a message as the investor.
 */
const sendUserMessage = async (userId, body) => {
  const conversation = await conversationRepo.findOrCreate(userId);
  const message = await messageRepo.createMessage({
    conversationId: conversation._id,
    senderId: userId,
    senderRole: 'investor',
    body,
  });

  // Update conversation metadata
  const updateData = {
    lastMessageAt: new Date(),
    lastMessageBy: 'user',
    lastMessagePreview: body.substring(0, 100),
    unreadByAdmin: true,
  };

  // Set awaitingAgentSince only if not already set (oldest unanswered message rule)
  if (!conversation.awaitingAgentSince) {
    updateData.awaitingAgentSince = new Date();
  }

  await conversationRepo.updateById(conversation._id, updateData);

  return { message, conversationId: conversation._id };
};

/**
 * Send a message as an agent/admin.
 */
const sendAgentMessage = async (agentId, agentRole, conversationId, body) => {
  const message = await messageRepo.createMessage({
    conversationId,
    senderId: agentId,
    senderRole: agentRole,
    body,
  });

  // Replying clears the SLA timer (awaitingAgentSince → null)
  await conversationRepo.updateById(conversationId, {
    lastMessageAt: new Date(),
    lastMessageBy: 'agent',
    lastMessagePreview: body.substring(0, 100),
    unreadByUser: true,
    unreadByAdmin: false,
    awaitingAgentSince: null,
  });

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
 * Admin: get messages for a specific conversation
 */
const getConversationMessages = async (conversationId, agentId, agentRole) => {
  const messages = await messageRepo.findByConversationId(conversationId, { limit: 100 });
  // Mark investor messages as read when agent opens conversation
  await messageRepo.markReadByConversation(conversationId, agentRole);
  await conversationRepo.updateById(conversationId, { unreadByAdmin: false });
  return messages;
};

module.exports = {
  getOrCreateConversation,
  sendUserMessage,
  sendAgentMessage,
  getConversations,
  getConversationMessages,
};

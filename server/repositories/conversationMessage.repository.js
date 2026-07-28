const ConversationMessage = require('../models/ConversationMessage');

const createMessage = async ({ conversationId, senderId, senderRole, body, attachmentUrl }) => {
  return ConversationMessage.create({
    conversationId,
    senderId,
    senderRole,
    body,
    attachmentUrl: attachmentUrl || null,
    sentAt: new Date(),
  });
};

const findByConversationId = async (conversationId, { skip = 0, limit = 50 } = {}) => {
  return ConversationMessage.find({ conversationId })
    .sort({ sentAt: 1 })
    .skip(skip)
    .limit(limit);
};

const markReadByConversation = async (conversationId, readerRole) => {
  // Mark all messages in the conversation as read where the sender is NOT the reader
  const senderRole = readerRole === 'investor' ? { $in: ['admin', 'support_agent'] } : 'investor';
  return ConversationMessage.updateMany(
    { conversationId, senderRole, readAt: null },
    { $set: { readAt: new Date() } }
  );
};

const countUnread = async (conversationId, readerRole) => {
  const senderRole = readerRole === 'investor' ? { $in: ['admin', 'support_agent'] } : 'investor';
  return ConversationMessage.countDocuments({ conversationId, senderRole, readAt: null });
};

module.exports = {
  createMessage,
  findByConversationId,
  markReadByConversation,
  countUnread,
};

const ConversationMessage = require('../models/ConversationMessage');

const create = (data) => ConversationMessage.create({ ...data, sentAt: new Date() });

const findByConversationId = (conversationId, { skip = 0, limit = 50 } = {}) =>
  ConversationMessage.find({ conversationId }).sort({ sentAt: -1 }).skip(skip).limit(limit).lean();

const findBySessionId = (sessionId, { skip = 0, limit = 100 } = {}) =>
  ConversationMessage.find({ sessionId }).sort({ sentAt: 1 }).skip(skip).limit(limit).lean();

const deleteBySessionId = (sessionId) =>
  ConversationMessage.deleteMany({ sessionId });

const markReadByConversation = (conversationId, readerRole) => {
  const isUserReader = ['investor', 'guest'].includes(readerRole);
  const senderRole = isUserReader ? { $in: ['admin', 'support_agent'] } : { $in: ['investor', 'guest'] };
  return ConversationMessage.updateMany(
    { conversationId, senderRole, readAt: null },
    { $set: { readAt: new Date() } }
  );
};

const deleteByConversationId = (conversationId) =>
  ConversationMessage.deleteMany({ conversationId });

module.exports = { create, findByConversationId, findBySessionId, deleteBySessionId, markReadByConversation, deleteByConversationId };

const ConversationSession = require('../models/ConversationSession');

const create = (data) => ConversationSession.create(data);

const findActiveByConversationId = (conversationId) =>
  ConversationSession.find({ conversationId, closedAt: null, hiddenFromUser: { $ne: true } }).sort({ createdAt: -1 }).lean();

const findActiveById = (id) => ConversationSession.findOne({ _id: id, closedAt: null });

const findById = (id) => ConversationSession.findById(id);

const closeSession = (id, closeReason) =>
  ConversationSession.findByIdAndUpdate(
    id,
    { closedAt: new Date(), closeReason },
    { returnDocument: 'after' }
  );

const findLatestActiveSession = (conversationId) =>
  ConversationSession.findOne({ conversationId, closedAt: null })
    .sort({ createdAt: -1 })
    .lean();

const countActiveByConversationId = (conversationId) =>
  ConversationSession.countDocuments({ conversationId, closedAt: null });

const deleteById = (id) => ConversationSession.findByIdAndDelete(id);

const deleteByConversationId = (conversationId) =>
  ConversationSession.deleteMany({ conversationId });

module.exports = {
  create,
  findActiveByConversationId,
  findActiveById,
  findById,
  closeSession,
  findLatestActiveSession,
  countActiveByConversationId,
  deleteById,
  deleteByConversationId,
};

const ConversationSession = require('../models/ConversationSession');

const create = (data) => ConversationSession.create(data);

const findActiveByConversationId = (conversationId) =>
  ConversationSession.find({ conversationId, closedAt: null }).sort({ createdAt: -1 }).lean();

const findActiveById = (id) => ConversationSession.findOne({ _id: id, closedAt: null });

const findById = (id) => ConversationSession.findById(id);

const closeSession = (id, closeReason) =>
  ConversationSession.findByIdAndUpdate(
    id,
    { closedAt: new Date(), closeReason },
    { new: true }
  );

const findLatestActiveSession = (conversationId) =>
  ConversationSession.findOne({ conversationId, closedAt: null })
    .sort({ createdAt: -1 })
    .lean();

const countActiveByConversationId = (conversationId) =>
  ConversationSession.countDocuments({ conversationId, closedAt: null });

module.exports = {
  create,
  findActiveByConversationId,
  findActiveById,
  findById,
  closeSession,
  findLatestActiveSession,
  countActiveByConversationId,
};

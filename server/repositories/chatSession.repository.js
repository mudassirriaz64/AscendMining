const ChatSession = require('../models/ChatSession');

const create = async ({ conversationId, userId }) => {
  return ChatSession.create({ conversationId, userId });
};

const findActiveByUserId = async (userId) => {
  return ChatSession.findOne({ userId, isActive: true, status: 'open' })
    .sort({ lastMessageAt: -1 });
};

const findByUserId = async (userId, { skip = 0, limit = 50 } = {}) => {
  return ChatSession.find({ userId })
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countByUserId = async (userId) => {
  return ChatSession.countDocuments({ userId });
};

const findById = async (id) => {
  return ChatSession.findById(id);
};

const updateById = async (id, updateData) => {
  return ChatSession.findByIdAndUpdate(id, updateData, { new: true });
};

const incrementMessageCount = async (id) => {
  return ChatSession.findByIdAndUpdate(id, { $inc: { messageCount: 1 } }, { new: true });
};

module.exports = {
  create,
  findActiveByUserId,
  findByUserId,
  countByUserId,
  findById,
  updateById,
  incrementMessageCount,
};

const SupportTicket = require('../models/SupportTicket');

const create = async ({ userId, conversationId, subject, escalationReason }) => {
  return SupportTicket.create({ userId, conversationId, subject, escalationReason });
};

const findByUserId = async (userId, { skip = 0, limit = 20, status } = {}) => {
  const filter = { userId };
  if (status) filter.status = status;
  return SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

const countByUserId = async (userId, { status } = {}) => {
  const filter = { userId };
  if (status) filter.status = status;
  return SupportTicket.countDocuments(filter);
};

const findAll = async ({ skip = 0, limit = 30, status } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  return SupportTicket.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName username email')
    .populate('assignedAgent', 'fullName email');
};

const countAll = async ({ status } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  return SupportTicket.countDocuments(filter);
};

const findById = async (id) => {
  return SupportTicket.findById(id)
    .populate('userId', 'fullName username email')
    .populate('assignedAgent', 'fullName email');
};

const updateById = async (id, updateData) => {
  return SupportTicket.findByIdAndUpdate(id, updateData, { new: true });
};

module.exports = {
  create,
  findByUserId,
  countByUserId,
  findAll,
  countAll,
  findById,
  updateById,
};

const Conversation = require('../models/Conversation');

const findByUserId = async (userId) => {
  return Conversation.findOne({ userId });
};

const findOrCreate = async (userId) => {
  let convo = await Conversation.findOne({ userId });
  if (!convo) {
    convo = await Conversation.create({ userId });
  }
  return convo;
};

const updateById = async (id, updateData) => {
  return Conversation.findByIdAndUpdate(id, updateData, { new: true });
};

const findAll = async ({ skip = 0, limit = 30, sort = { lastMessageAt: -1 } } = {}) => {
  return Conversation.find({})
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName username email')
    .populate('assignedAgent', 'fullName email');
};

const countAll = async () => {
  return Conversation.countDocuments({});
};

const findUnread = async () => {
  return Conversation.find({ unreadByAdmin: true })
    .sort({ lastMessageAt: -1 })
    .populate('userId', 'fullName username email');
};

module.exports = {
  findByUserId,
  findOrCreate,
  updateById,
  findAll,
  countAll,
  findUnread,
};

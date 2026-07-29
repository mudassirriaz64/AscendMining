const Conversation = require('../models/Conversation');
require('../models/User');

const findByUserId = (userId) => Conversation.findOne({ userId });
const findByGuestId = (guestId) => Conversation.findOne({ guestId });
const findById = (id) => Conversation.findById(id);

// Atomic upsert plus the unique userId index makes concurrent first messages safe.
const getOrCreateByUserId = async (userId) => {
  try {
    return await Conversation.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code === 11000) return Conversation.findOne({ userId });
    throw error;
  }
};

const updateById = (id, updateData) => Conversation.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
const markAwaitingIfNull = (id, timestamp) => Conversation.findOneAndUpdate(
  { _id: id, awaitingAgentSince: null },
  { $set: { awaitingAgentSince: timestamp } },
  { returnDocument: 'after' }
);

const findAllUrgentFirst = ({ skip = 0, limit = 30 } = {}) => Conversation.aggregate([
  { $match: { hiddenFromAdmin: { $ne: true } } },
  { $addFields: { urgentRank: { $cond: [{ $ne: ['$awaitingAgentSince', null] }, 0, 1] } } },
  { $sort: { urgentRank: 1, awaitingAgentSince: 1, lastMessageAt: -1 } },
  { $skip: skip },
  { $limit: limit },
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  { $project: { urgentRank: 0, 'user.passwordHash': 0 } },
]);

const countAll = () => Conversation.countDocuments({ hiddenFromAdmin: { $ne: true } });
const countUnread = () => Conversation.countDocuments({ unreadByAdmin: true, hiddenFromAdmin: { $ne: true } });
const findAwaiting = () => Conversation.find({ awaitingAgentSince: { $ne: null }, hiddenFromAdmin: { $ne: true } })
  .sort({ awaitingAgentSince: 1 })
  .populate('userId', 'fullName username email');
const findOverdue = (threshold) => Conversation.find({ awaitingAgentSince: { $lte: threshold }, hiddenFromAdmin: { $ne: true } });

const deleteById = (id) => Conversation.findByIdAndDelete(id);

module.exports = {
  findByUserId,
  findByGuestId,
  findById,
  getOrCreateByUserId,
  updateById,
  markAwaitingIfNull,
  findAllUrgentFirst,
  countAll,
  countUnread,
  findAwaiting,
  findOverdue,
  deleteById,
};

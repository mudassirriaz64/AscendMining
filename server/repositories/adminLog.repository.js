const AdminLog = require('../models/AdminLog');
require('../models/Admin');
require('../models/User');

const create = async (data) => {
  return AdminLog.create(data);
};

// Attach the target user's username (for targetType === 'User') so audit
// rows can display a human-readable identity instead of a raw ObjectId.
const attachTargetNames = async (logs) => {
  const userTargetIds = logs.filter((l) => l.targetType === 'User').map((l) => l.targetId);
  const users =
    userTargetIds.length > 0
      ? await mongoose.model('User').find({ _id: { $in: userTargetIds } }).select('username').lean()
      : [];
  const userMap = new Map(users.map((u) => [String(u._id), u.username]));

  return logs.map((l) => {
    const obj = l.toObject();
    if (obj.targetType === 'User') {
      obj.targetName = userMap.get(String(obj.targetId)) || null;
    }
    return obj;
  });
};

const findByTarget = async (targetType, targetId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    AdminLog.find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'fullName email'),
    AdminLog.countDocuments({ targetType, targetId }),
  ]);
  const logs = await attachTargetNames(docs);
  return { logs, total, page, limit };
};

const findByActor = async (actorId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AdminLog.find({ actorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminLog.countDocuments({ actorId }),
  ]);
  return { logs, total, page, limit };
};

const mongoose = require('mongoose');

const findAllPaged = async ({ page = 1, limit = 20, action, search }) => {
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const filter = {};

  if (action && action !== 'all') {
    filter.action = action;
  }

  if (search) {
    const isObjectId = mongoose.Types.ObjectId.isValid(search);
    const searchConditions = [];

    if (isObjectId) {
      searchConditions.push({ targetId: search });
      searchConditions.push({ actorId: search });
    }

    searchConditions.push({ ipAddress: { $regex: search, $options: 'i' } });
    searchConditions.push({ targetType: { $regex: search, $options: 'i' } });

    // Lookup matching admins dynamically
    const Admin = mongoose.model('Admin');
    const matchingAdmins = await Admin.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    if (matchingAdmins.length > 0) {
      const adminIds = matchingAdmins.map((a) => a._id);
      searchConditions.push({ actorId: { $in: adminIds } });
    }

    // Lookup matching users so their target logs can be found by username
    const User = mongoose.model('User');
    const matchingUsers = await User.find({
      username: { $regex: search, $options: 'i' },
    }).select('_id');

    if (matchingUsers.length > 0) {
      const userIds = matchingUsers.map((u) => u._id);
      searchConditions.push({ targetId: { $in: userIds } });
    }

    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }
  }

  const [docs, total] = await Promise.all([
    AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('actorId', 'fullName email'),
    AdminLog.countDocuments(filter),
  ]);

  const logs = await attachTargetNames(docs);

  return { logs, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

module.exports = {
  create,
  findByTarget,
  findByActor,
  findAllPaged,
};

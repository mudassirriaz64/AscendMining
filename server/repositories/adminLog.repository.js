const AdminLog = require('../models/AdminLog');
require('../models/Admin');

const create = async (data) => {
  return AdminLog.create(data);
};

const findByTarget = async (targetType, targetId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AdminLog.find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'username email'),
    AdminLog.countDocuments({ targetType, targetId }),
  ]);
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
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    if (matchingAdmins.length > 0) {
      const adminIds = matchingAdmins.map((a) => a._id);
      searchConditions.push({ actorId: { $in: adminIds } });
    }

    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }
  }

  const [logs, total] = await Promise.all([
    AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('actorId', 'username email'),
    AdminLog.countDocuments(filter),
  ]);

  return { logs, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

module.exports = {
  create,
  findByTarget,
  findByActor,
  findAllPaged,
};

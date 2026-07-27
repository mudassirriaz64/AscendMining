const AdminLog = require('../models/AdminLog');

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

module.exports = {
  create,
  findByTarget,
  findByActor,
};

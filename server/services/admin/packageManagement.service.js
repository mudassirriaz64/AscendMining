const packageRepository = require('../../repositories/package.repository');
const coinRepository = require('../../repositories/coin.repository');
const adminLogRepository = require('../../repositories/adminLog.repository');
const AppError = require('../../utils/AppError');

const listPackages = async ({ search, status, page = 1, limit = 20 }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [packages, total] = await Promise.all([
    packageRepository.findAll(filter, { skip, limit }),
    packageRepository.countByFilter(filter),
  ]);
  return { packages, total, page, limit };
};

const getPackage = async (packageId) => {
  const pkg = await packageRepository.findById(packageId);
  if (!pkg) throw new AppError('PACKAGE_NOT_FOUND', 'Package not found.', 404);
  return pkg;
};

const createPackage = async (data, adminId, ip) => {
  if (!data.coins || data.coins.length === 0) {
    throw new AppError('COINS_REQUIRED', 'At least one coin must be assigned to the package.', 400);
  }

  const coins = await coinRepository.findAll({ _id: { $in: data.coins }, isActive: true });
  if (coins.length !== data.coins.length) {
    throw new AppError('INVALID_COINS', 'One or more selected coins are invalid or inactive.', 400);
  }

  const pkg = await packageRepository.create(data);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'package_created',
    targetType: 'Package',
    targetId: pkg._id,
    beforeState: null,
    afterState: pkg.toJSON(),
    ipAddress: ip,
  });

  return pkg;
};

const updatePackage = async (packageId, updateData, adminId, ip) => {
  const pkg = await packageRepository.findById(packageId);
  if (!pkg) throw new AppError('PACKAGE_NOT_FOUND', 'Package not found.', 404);

  if (updateData.coins) {
    if (updateData.coins.length === 0) {
      throw new AppError('COINS_REQUIRED', 'At least one coin must be assigned to the package.', 400);
    }
    const coins = await coinRepository.findAll({ _id: { $in: updateData.coins } });
    if (coins.length !== updateData.coins.length) {
      throw new AppError('INVALID_COINS', 'One or more selected coins are invalid.', 400);
    }
  }

  const beforeState = pkg.toJSON();
  const updated = await packageRepository.updateById(packageId, updateData);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'package_updated',
    targetType: 'Package',
    targetId: packageId,
    beforeState,
    afterState: updated.toJSON(),
    ipAddress: ip,
  });

  return updated;
};

const togglePackageStatus = async (packageId, adminId, ip) => {
  const pkg = await packageRepository.findById(packageId);
  if (!pkg) throw new AppError('PACKAGE_NOT_FOUND', 'Package not found.', 404);

  const beforeState = { status: pkg.status };
  const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
  const updated = await packageRepository.updateById(packageId, { status: newStatus });

  await adminLogRepository.create({
    actorId: adminId,
    action: newStatus === 'active' ? 'package_created' : 'package_cancelled',
    targetType: 'Package',
    targetId: packageId,
    beforeState,
    afterState: { status: newStatus },
    ipAddress: ip,
  });

  return updated;
};

const deletePackage = async (packageId, adminId, ip) => {
  const pkg = await packageRepository.findById(packageId);
  if (!pkg) throw new AppError('PACKAGE_NOT_FOUND', 'Package not found.', 404);

  // Check if any UserPackage references this base package
  const UserPackage = require('../../models/UserPackage');
  const activeSubscriptions = await UserPackage.countDocuments({ packageId });
  if (activeSubscriptions > 0) {
    throw new AppError(
      'PACKAGE_IN_USE',
      'Cannot delete package as it has active or historical user subscriptions. Please deactivate it instead.',
      400
    );
  }

  const beforeState = pkg.toJSON();
  await packageRepository.deleteById(packageId);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'package_deleted',
    targetType: 'Package',
    targetId: packageId,
    beforeState,
    afterState: null,
    ipAddress: ip,
  });

  return pkg;
};

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  togglePackageStatus,
  deletePackage,
};

const coinRepository = require('../../repositories/coin.repository');
const adminLogRepository = require('../../repositories/adminLog.repository');
const AppError = require('../../utils/AppError');

const listCoins = async ({ search, isActive, page = 1, limit = 20 }) => {
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { symbol: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [coins, total] = await Promise.all([
    coinRepository.findAll(filter, { skip, limit }),
    coinRepository.countByFilter(filter),
  ]);
  return { coins, total, page, limit };
};

const getCoin = async (coinId) => {
  const coin = await coinRepository.findById(coinId);
  if (!coin) throw new AppError('COIN_NOT_FOUND', 'Coin not found.', 404);
  return coin;
};

const createCoin = async (data, adminId, ip) => {
  const existing = await coinRepository.findBySymbol(data.symbol);
  if (existing) throw new AppError('COIN_EXISTS', 'A coin with this symbol already exists.', 409);

  const coin = await coinRepository.create(data);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'coin_created',
    targetType: 'Coin',
    targetId: coin._id,
    beforeState: null,
    afterState: coin.toJSON(),
    ipAddress: ip,
  });

  return coin;
};

const updateCoin = async (coinId, updateData, adminId, ip) => {
  const coin = await coinRepository.findById(coinId);
  if (!coin) throw new AppError('COIN_NOT_FOUND', 'Coin not found.', 404);

  if (updateData.symbol && updateData.symbol.toUpperCase() !== coin.symbol) {
    const existing = await coinRepository.findBySymbol(updateData.symbol);
    if (existing) throw new AppError('COIN_EXISTS', 'A coin with this symbol already exists.', 409);
  }

  const beforeState = coin.toJSON();
  const updated = await coinRepository.updateById(coinId, updateData);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'coin_updated',
    targetType: 'Coin',
    targetId: coinId,
    beforeState,
    afterState: updated.toJSON(),
    ipAddress: ip,
  });

  return updated;
};

const toggleCoinStatus = async (coinId, adminId, ip) => {
  const coin = await coinRepository.findById(coinId);
  if (!coin) throw new AppError('COIN_NOT_FOUND', 'Coin not found.', 404);

  const beforeState = { isActive: coin.isActive };
  const updated = await coinRepository.updateById(coinId, { isActive: !coin.isActive });

  await adminLogRepository.create({
    actorId: adminId,
    action: 'coin_updated',
    targetType: 'Coin',
    targetId: coinId,
    beforeState,
    afterState: { isActive: updated.isActive },
    ipAddress: ip,
  });

  return updated;
};

const deleteCoin = async (coinId, adminId, ip) => {
  const coin = await coinRepository.findById(coinId);
  if (!coin) throw new AppError('COIN_NOT_FOUND', 'Coin not found.', 404);

  const Package = require('../../models/Package');
  const packageUsingCoin = await Package.findOne({ coins: coinId });
  if (packageUsingCoin) {
    throw new AppError('COIN_IN_USE', 'Cannot delete coin that is assigned to a package.', 409);
  }

  const beforeState = coin.toJSON();
  await Package.updateMany({ coins: coinId }, { $pull: { coins: coinId } });

  const Coin = require('../../models/Coin');
  await Coin.findByIdAndDelete(coinId);

  await adminLogRepository.create({
    actorId: adminId,
    action: 'coin_deleted',
    targetType: 'Coin',
    targetId: coinId,
    beforeState,
    afterState: null,
    ipAddress: ip,
  });

  return { message: 'Coin deleted successfully.' };
};

module.exports = {
  listCoins,
  getCoin,
  createCoin,
  updateCoin,
  toggleCoinStatus,
  deleteCoin,
};

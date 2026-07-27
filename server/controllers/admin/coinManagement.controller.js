const coinManagementService = require('../../services/admin/coinManagement.service');

const listCoins = async (req, res, next) => {
  try {
    const result = await coinManagementService.listCoins(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getCoin = async (req, res, next) => {
  try {
    const coin = await coinManagementService.getCoin(req.params.id);
    res.status(200).json({ success: true, data: { coin } });
  } catch (error) {
    next(error);
  }
};

const createCoin = async (req, res, next) => {
  try {
    const coin = await coinManagementService.createCoin(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, message: 'Coin created successfully.', data: { coin } });
  } catch (error) {
    next(error);
  }
};

const updateCoin = async (req, res, next) => {
  try {
    const coin = await coinManagementService.updateCoin(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Coin updated successfully.', data: { coin } });
  } catch (error) {
    next(error);
  }
};

const toggleCoinStatus = async (req, res, next) => {
  try {
    const coin = await coinManagementService.toggleCoinStatus(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Coin status toggled.', data: { coin } });
  } catch (error) {
    next(error);
  }
};

const deleteCoin = async (req, res, next) => {
  try {
    const result = await coinManagementService.deleteCoin(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCoins,
  getCoin,
  createCoin,
  updateCoin,
  toggleCoinStatus,
  deleteCoin,
};

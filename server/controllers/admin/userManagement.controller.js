const userManagementService = require('../../services/admin/userManagement.service');
const { emitBalanceUpdate } = require('../../utils/dashboardEvents');

const listUsers = async (req, res, next) => {
  try {
    const result = await userManagementService.listUsers(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const user = await userManagementService.getUserDetail(req.params.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const getUserPackages = async (req, res, next) => {
  try {
    const result = await userManagementService.getUserPackages(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserDeposits = async (req, res, next) => {
  try {
    const result = await userManagementService.getUserDeposits(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserWithdrawals = async (req, res, next) => {
  try {
    const result = await userManagementService.getUserWithdrawals(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserReferrals = async (req, res, next) => {
  try {
    const result = await userManagementService.getUserReferrals(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserScreenshots = async (req, res, next) => {
  try {
    const result = await userManagementService.getUserScreenshots(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const result = await userManagementService.suspendUser(
      req.params.id,
      req.user.id,
      req.body.reason,
      req.ip
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const reactivateUser = async (req, res, next) => {
  try {
    const result = await userManagementService.reactivateUser(
      req.params.id,
      req.user.id,
      req.ip
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const triggerPasswordReset = async (req, res, next) => {
  try {
    const result = await userManagementService.triggerPasswordReset(
      req.params.id,
      req.user.id,
      req.ip
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const adjustUserBalance = async (req, res, next) => {
  try {
    const result = await userManagementService.adjustUserBalance(
      req.params.id,
      req.body,
      req.user.id,
      req.ip
    );

    // Emit real-time dashboard events
    const { emitBalanceUpdate, emitTransactionUpdate } = require('../../utils/dashboardEvents');
    emitBalanceUpdate(req.app, req.params.id, { walletBalance: result.walletBalance });
    if (result.transaction) {
      emitTransactionUpdate(req.app, req.params.id, result.transaction);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: { walletBalance: result.walletBalance }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserDetail,
  getUserPackages,
  getUserDeposits,
  getUserWithdrawals,
  getUserReferrals,
  getUserScreenshots,
  suspendUser,
  reactivateUser,
  triggerPasswordReset,
  adjustUserBalance,
};

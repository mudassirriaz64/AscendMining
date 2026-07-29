const express = require('express');
const router = express.Router();
const userManagementController = require('../../controllers/admin/userManagement.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  listUsersSchema,
  userIdParamSchema,
  paginationSchema,
  suspendUserSchema,
} = require('../../validators/admin/userManagement.validator');

const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters.',
        status: 422,
        details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }
  req.params = result.data;
  next();
};

router.get(
  '/',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validate(listUsersSchema),
  userManagementController.listUsers
);

router.get(
  '/:id',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  userManagementController.getUserDetail
);

router.get(
  '/:id/packages',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  validate(paginationSchema),
  userManagementController.getUserPackages
);

router.get(
  '/:id/deposits',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  validate(paginationSchema),
  userManagementController.getUserDeposits
);

router.get(
  '/:id/withdrawals',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  validate(paginationSchema),
  userManagementController.getUserWithdrawals
);

router.get(
  '/:id/referrals',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  validate(paginationSchema),
  userManagementController.getUserReferrals
);

router.get(
  '/:id/screenshots',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(userIdParamSchema),
  validate(paginationSchema),
  userManagementController.getUserScreenshots
);

router.patch(
  '/:id/suspend',
  authMiddleware,
  requireRole('admin'),
  validateParams(userIdParamSchema),
  validate(suspendUserSchema),
  userManagementController.suspendUser
);

router.patch(
  '/:id/reactivate',
  authMiddleware,
  requireRole('admin'),
  validateParams(userIdParamSchema),
  userManagementController.reactivateUser
);

router.post(
  '/:id/reset-password',
  authMiddleware,
  requireRole('admin'),
  validateParams(userIdParamSchema),
  userManagementController.triggerPasswordReset
);

router.post(
  '/:id/adjust-balance',
  authMiddleware,
  requireRole('admin'),
  validateParams(userIdParamSchema),
  userManagementController.adjustUserBalance
);

module.exports = router;

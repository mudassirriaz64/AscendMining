const express = require('express');
const router = express.Router();
const coinManagementController = require('../../controllers/admin/coinManagement.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createCoinSchema,
  updateCoinSchema,
  coinIdParamSchema,
  listCoinsSchema,
} = require('../../validators/admin/coinManagement.validator');

const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters.',
        status: 422,
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
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
  validate(listCoinsSchema),
  coinManagementController.listCoins
);

router.get(
  '/:id',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(coinIdParamSchema),
  coinManagementController.getCoin
);

router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  validate(createCoinSchema),
  coinManagementController.createCoin
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validateParams(coinIdParamSchema),
  validate(updateCoinSchema),
  coinManagementController.updateCoin
);

router.patch(
  '/:id/toggle',
  authMiddleware,
  requireRole('admin'),
  validateParams(coinIdParamSchema),
  coinManagementController.toggleCoinStatus
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validateParams(coinIdParamSchema),
  coinManagementController.deleteCoin
);

module.exports = router;

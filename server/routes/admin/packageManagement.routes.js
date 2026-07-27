const express = require('express');
const router = express.Router();
const packageManagementController = require('../../controllers/admin/packageManagement.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createPackageSchema,
  updatePackageSchema,
  packageIdParamSchema,
  listPackagesSchema,
} = require('../../validators/admin/packageManagement.validator');

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
  validate(listPackagesSchema),
  packageManagementController.listPackages
);

router.get(
  '/:id',
  authMiddleware,
  requireRole('admin', 'support_agent'),
  validateParams(packageIdParamSchema),
  packageManagementController.getPackage
);

router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  validate(createPackageSchema),
  packageManagementController.createPackage
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validateParams(packageIdParamSchema),
  validate(updatePackageSchema),
  packageManagementController.updatePackage
);

router.patch(
  '/:id/toggle',
  authMiddleware,
  requireRole('admin'),
  validateParams(packageIdParamSchema),
  packageManagementController.togglePackageStatus
);

module.exports = router;

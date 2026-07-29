const packageManagementService = require('../../services/admin/packageManagement.service');

const listPackages = async (req, res, next) => {
  try {
    const result = await packageManagementService.listPackages(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPackage = async (req, res, next) => {
  try {
    const pkg = await packageManagementService.getPackage(req.params.id);
    res.status(200).json({ success: true, data: { package: pkg } });
  } catch (error) {
    next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const pkg = await packageManagementService.createPackage(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, message: 'Package created successfully.', data: { package: pkg } });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const pkg = await packageManagementService.updatePackage(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Package updated successfully.', data: { package: pkg } });
  } catch (error) {
    next(error);
  }
};

const togglePackageStatus = async (req, res, next) => {
  try {
    const pkg = await packageManagementService.togglePackageStatus(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Package status toggled.', data: { package: pkg } });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const pkg = await packageManagementService.deletePackage(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Package deleted successfully.', data: { package: pkg } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  togglePackageStatus,
  deletePackage,
};

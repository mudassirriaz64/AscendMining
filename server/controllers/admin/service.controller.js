const Service = require('../../models/Service');
const AdminLog = require('../../models/AdminLog');

const getAllServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { services },
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { title, description, icon, isActive, order } = req.body;
    
    const newService = await Service.create({
      title,
      description,
      icon,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    await AdminLog.create({
      actorId: req.user.id,
      action: 'service_created',
      targetType: 'Service',
      targetId: newService._id,
      beforeState: null,
      afterState: newService.toJSON(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service: newService }
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, icon, isActive, order } = req.body;

    const original = await Service.findById(id);
    if (!original) {
      return res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }
    const beforeState = original.toJSON();

    const service = await Service.findByIdAndUpdate(
      id,
      { title, description, icon, isActive, order },
      { new: true, runValidators: true }
    );

    await AdminLog.create({
      actorId: req.user.id,
      action: 'service_updated',
      targetType: 'Service',
      targetId: service._id,
      beforeState,
      afterState: service.toJSON(),
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }
    const beforeState = service.toJSON();

    await Service.findByIdAndDelete(id);

    await AdminLog.create({
      actorId: req.user.id,
      action: 'service_deleted',
      targetType: 'Service',
      targetId: id,
      beforeState,
      afterState: null,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService,
};

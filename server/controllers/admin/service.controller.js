const Service = require('../../models/Service');

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

    const service = await Service.findByIdAndUpdate(
      id,
      { title, description, icon, isActive, order },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }

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
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }

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

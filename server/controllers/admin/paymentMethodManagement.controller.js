const PaymentMethod = require('../../models/PaymentMethod');

const getAllPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { paymentMethods },
    });
  } catch (error) {
    next(error);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const { name, type, instructions, minDeposit, maxDeposit, status } = req.body;
    
    const newMethod = await PaymentMethod.create({
      name,
      type,
      instructions,
      minDeposit,
      maxDeposit,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: { paymentMethod: newMethod }
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, instructions, minDeposit, maxDeposit, status } = req.body;

    const method = await PaymentMethod.findByIdAndUpdate(
      id,
      { name, type, instructions, minDeposit, maxDeposit, status },
      { new: true, runValidators: true }
    );

    if (!method) {
      return res.status(404).json({ success: false, error: { message: 'Payment method not found' } });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: { paymentMethod: method }
    });
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.findByIdAndDelete(id);

    if (!method) {
      return res.status(404).json({ success: false, error: { message: 'Payment method not found' } });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const method = await PaymentMethod.findById(id);

    if (!method) {
      return res.status(404).json({ success: false, error: { message: 'Payment method not found' } });
    }

    method.status = method.status === 'active' ? 'inactive' : 'active';
    await method.save();

    res.status(200).json({
      success: true,
      message: `Payment method ${method.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { paymentMethod: method }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  toggleStatus,
};

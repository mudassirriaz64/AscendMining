const PaymentMethod = require('../models/PaymentMethod');

const listPaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ status: 'active' });
    res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPaymentMethods,
};

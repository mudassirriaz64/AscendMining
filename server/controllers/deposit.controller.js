const depositService = require('../services/deposit.service');

const submitDeposit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deposit = await depositService.submitDeposit(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully! Pending payment verification.',
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitDeposit,
};

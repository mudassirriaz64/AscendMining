const depositService = require('../services/deposit.service');
const { emitAdminUpdate } = require('../utils/dashboardEvents');

const submitDeposit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deposit = await depositService.submitDeposit(userId, req.body);

    // Emit real-time notification to admins
    emitAdminUpdate(req.app, 'admin:deposit:new', {
      _id: deposit._id,
      userId,
      amount: deposit.amount,
      status: 'pending',
      createdAt: deposit.createdAt,
    });

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

const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const Deposit = require('../models/Deposit');
const PaymentMethod = require('../models/PaymentMethod');

const listPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ status: 'active' }).populate('coins');
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

const purchasePackage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      packageId, 
      paymentMethodId, 
      senderHolderName, 
      senderPhone, 
      senderBankName, 
      screenshot 
    } = req.body;

    if (!packageId || !paymentMethodId || !screenshot) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Package, payment method, and payment screenshot proof are required.',
          status: 400,
        },
      });
    }

    // 1. Fetch package
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'The selected mining package does not exist.',
          status: 404,
        },
      });
    }

    // 2. Fetch payment method
    const pm = await PaymentMethod.findById(paymentMethodId);
    if (!pm || pm.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_METHOD_NOT_FOUND',
          message: 'The selected payment method is not active or available.',
          status: 404,
        },
      });
    }

    // 3. Create UserPackage document (unpaid status)
    const userPackage = await UserPackage.create({
      userId,
      packageId: pkg._id,
      purchaseAmount: pkg.price,
      dailyROISnapshot: pkg.dailyROI,
      durationSnapshot: pkg.duration,
      hashRateSnapshot: pkg.hashRate,
      status: 'pending_deposit',
      isMining: false,
    });

    // 4. Create Deposit document (pending status) referencing the user package
    const deposit = await Deposit.create({
      userId,
      packageId: userPackage._id,
      paymentMethod: pm._id,
      amount: pkg.price,
      screenshot, // Can store base64 string directly
      senderHolderName: senderHolderName || null,
      senderPhone: senderPhone || null,
      senderBankName: senderBankName || null,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Plan purchase request submitted successfully! Pending payment verification.',
      data: {
        userPackage,
        deposit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPackages,
  purchasePackage,
};

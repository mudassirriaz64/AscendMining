const Deposit = require('../models/Deposit');
const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');

const submitDeposit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      amount,
      paymentMethodId,
      senderHolderName,
      senderPhone,
      senderBankName,
      screenshot,
    } = req.body;

    if (!amount || !paymentMethodId || !screenshot) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Amount, payment method, and screenshot proof are required.',
          status: 400,
        },
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number.',
          status: 400,
        },
      });
    }

    // 1. Fetch payment method
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

    // 2. Upload screenshot to Cloudinary
    let screenshotUrl = screenshot;
    if (screenshot && screenshot.startsWith('data:image/')) {
      try {
        const cloudinary = require('../config/cloudinary');
        const uploadResult = await cloudinary.uploader.upload(screenshot, {
          folder: `ascend-mining/users/${userId}/deposits`,
          resource_type: 'image',
        });
        screenshotUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload payment proof to Cloudinary. Please try again.',
            status: 500,
          },
        });
      }
    }

    // 3. Create Deposit document (pending status) with no packageId
    const deposit = await Deposit.create({
      userId,
      packageId: null,
      paymentMethod: pm._id,
      amount: parsedAmount,
      screenshot: screenshotUrl,
      senderHolderName: senderHolderName || null,
      senderPhone: senderPhone || null,
      senderBankName: senderBankName || null,
      status: 'pending',
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

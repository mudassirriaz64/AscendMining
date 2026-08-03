const crypto = require('crypto');
const mongoose = require('mongoose');
let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }
const cloudinary = require('../config/cloudinary');
const depositRepository = require('../repositories/deposit.repository');
const userRepository = require('../repositories/user.repository');
const adminLogRepository = require('../repositories/adminLog.repository');
const PaymentMethod = require('../models/PaymentMethod');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');
const AppError = require('../utils/AppError');

// Helper to calculate SHA-256 hash of a buffer
const calculateBufferHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Helper to upload a buffer to Cloudinary
const uploadBufferToCloudinary = (fileBuffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const submitDeposit = async (userId, { paymentMethodId, amount, screenshot, senderHolderName, senderPhone, senderBankName }) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Deposit amount must be a positive number.', 400);
  }

  // 1. Fetch active payment method
  const pm = await PaymentMethod.findById(paymentMethodId);
  if (!pm || pm.status !== 'active') {
    throw new AppError('PAYMENT_METHOD_NOT_FOUND', 'The selected payment method is not active or available.', 404);
  }

  // 2. Decode base64 image/file
  const matches = screenshot.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer;
  let mimeType = 'image/jpeg';
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(screenshot, 'utf-8');
  }

  // 3. Duplicate Screenshot hash check (cryptographic validation)
  const screenshotHash = calculateBufferHash(buffer);
  const existingDup = await depositRepository.findByScreenshotHash(screenshotHash);
  if (existingDup) {
    throw new AppError('DUPLICATE_PAYMENT_PROOF', 'This payment proof screenshot has already been uploaded.', 422);
  }

  // Generate deposit ID first to use in specced folder path
  const depositId = new mongoose.Types.ObjectId();
  const folder = `ascendhash/deposits/${depositId}`;
  
  // 4. Compress image if it is indeed an image
  let uploadBuffer = buffer;
  const isPdf = mimeType.includes('pdf');
  if (!isPdf && sharp) {
    try {
      uploadBuffer = await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (err) {
      console.warn('[Sharp] Compression failed, uploading original buffer.', err);
    }
  }

  // 5. Upload to Cloudinary following folder convention
  let screenshotUrl;
  try {
    const uploadResult = await uploadBufferToCloudinary(uploadBuffer, folder, 'proof');
    screenshotUrl = uploadResult.secure_url;
  } catch (err) {
    console.error('[Cloudinary] Proof upload failed:', err);
    throw new AppError('UPLOAD_FAILED', 'Failed to upload payment proof to Cloudinary. Please try again.', 500);
  }

  // 6. Create Deposit Document
  const deposit = await depositRepository.create({
    _id: depositId,
    userId,
    packageId: null,
    paymentMethod: pm._id,
    amount: parsedAmount,
    screenshot: screenshotUrl,
    screenshotHash,
    senderHolderName: senderHolderName || null,
    senderPhone: senderPhone || null,
    senderBankName: senderBankName || null,
    status: 'pending',
  });

  return deposit;
};

const getPendingDeposits = async ({ page = 1, limit = 20, status = 'pending' }) => {
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [deposits, total] = await Promise.all([
    depositRepository.findAll(filter, {
      populate: [
        'userId',
        { path: 'packageId', populate: { path: 'packageId' } },
        'paymentMethod',
      ],
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit, 10),
    }),
    depositRepository.countByFilter(filter),
  ]);
  return { deposits, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

const approveDeposit = async (id, adminId, ip) => {
  const deposit = await depositRepository.findById(id);
  if (!deposit) throw new AppError('DEPOSIT_NOT_FOUND', 'Deposit not found.', 404);
  if (deposit.status !== 'pending') throw new AppError('DEPOSIT_ALREADY_PROCESSED', 'Deposit is not pending.', 400);

  const user = await userRepository.findById(deposit.userId);
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  // Approve status
  deposit.status = 'approved';
  deposit.approvedBy = adminId;
  deposit.approvedAt = new Date();
  await deposit.save();

  // Credit wallet balance
  const newWalletBalance = user.walletBalance + deposit.amount;
  await userRepository.updateById(user._id, { walletBalance: newWalletBalance });

  // Create transaction log
  const tx = await WalletTransaction.create({
    userId: user._id,
    currency: 'USD',
    type: 'deposit',
    amount: deposit.amount,
    referenceType: 'Deposit',
    referenceId: deposit._id,
    balanceAfter: newWalletBalance,
  });

  // Notify user
  await Notification.create({
    userId: user._id,
    title: 'Deposit Approved',
    message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved and added to your wallet balance.`,
    type: 'success',
    link: '/deposits',
  });

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'deposit_approved',
    targetId: user._id,
    targetType: 'User',
    beforeState: { status: 'pending', walletBalance: user.walletBalance },
    afterState: { status: 'approved', walletBalance: newWalletBalance },
    details: { depositId: deposit._id, amount: deposit.amount },
    ipAddress: ip,
  });

  return { deposit, newWalletBalance, tx };
};

const rejectDeposit = async (id, rejectionReason, adminId, ip) => {
  const deposit = await depositRepository.findById(id);
  if (!deposit) throw new AppError('DEPOSIT_NOT_FOUND', 'Deposit not found.', 404);
  if (deposit.status !== 'pending') throw new AppError('DEPOSIT_ALREADY_PROCESSED', 'Deposit is not pending.', 400);

  deposit.status = 'rejected';
  deposit.rejectionReason = rejectionReason;
  await deposit.save();

  // Notify user
  await Notification.create({
    userId: deposit.userId,
    title: 'Deposit Rejected',
    message: `Your deposit of $${deposit.amount.toFixed(2)} was rejected. Reason: ${rejectionReason}`,
    type: 'error',
    link: '/deposits',
  });

  // Log admin action
  await adminLogRepository.create({
    actorId: adminId,
    action: 'deposit_rejected',
    targetId: deposit.userId,
    targetType: 'User',
    beforeState: { status: 'pending' },
    afterState: { status: 'rejected', rejectionReason },
    details: { depositId: deposit._id, amount: deposit.amount, reason: rejectionReason },
    ipAddress: ip,
  });

  return deposit;
};

module.exports = {
  submitDeposit,
  getPendingDeposits,
  approveDeposit,
  rejectDeposit,
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('./middlewares/mongoSanitize');
const errorHandler = require('./middlewares/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const adminUserManagementRoutes = require('./routes/admin/userManagement.routes');
const adminCoinManagementRoutes = require('./routes/admin/coinManagement.routes');
const adminPackageManagementRoutes = require('./routes/admin/packageManagement.routes');
const adminDepositRoutes = require('./routes/admin/deposit.routes');
const adminWithdrawalRoutes = require('./routes/admin/withdrawalManagement.routes');
const adminPaymentMethodRoutes = require('./routes/admin/paymentMethodManagement.routes');
const adminFaqRoutes = require('./routes/admin/faq.routes');
const adminServiceRoutes = require('./routes/admin/service.routes');
const adminContactMessageRoutes = require('./routes/admin/contactMessage.routes');
const adminReferralRoutes = require('./routes/admin/referralManagement.routes');
const adminDashboardRoutes = require('./routes/admin/dashboardManagement.routes');
const adminMiningSettingsRoutes = require('./routes/admin/miningSettings.routes');
const adminUserPackageRoutes = require('./routes/admin/userPackageManagement.routes');
const adminKycRoutes = require('./routes/admin/kycManagement.routes');
const kycRoutes = require('./routes/kyc.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const miningRoutes = require('./routes/mining.routes');
const withdrawalRoutes = require('./routes/withdrawal.routes');
const walletRoutes = require('./routes/wallet.routes');
const packageRoutes = require('./routes/package.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes');
const notificationRoutes = require('./routes/notification.routes');
const depositRoutes = require('./routes/deposit.routes');
const supportChatRoutes = require('./routes/supportChat/index');
const supportTicketRoutes = require('./routes/supportTicket/index');
const adminSupportChatRoutes = require('./routes/supportChat/admin');
const adminSupportTicketRoutes = require('./routes/supportTicket/admin');
const publicServiceRoutes = require('./routes/service.routes');
const publicFaqRoutes = require('./routes/faq.routes');
const publicContactRoutes = require('./routes/contact.routes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize);

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserManagementRoutes);
app.use('/api/admin/coins', adminCoinManagementRoutes);
app.use('/api/admin/packages', adminPackageManagementRoutes);
app.use('/api/admin/deposits', adminDepositRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/admin/payment-methods', adminPaymentMethodRoutes);
app.use('/api/admin/faqs', adminFaqRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/contact-messages', adminContactMessageRoutes);
app.use('/api/admin/referrals', adminReferralRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/mining-settings', adminMiningSettingsRoutes);
app.use('/api/admin/user-packages', adminUserPackageRoutes);
app.use('/api/admin/kyc', adminKycRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/support/conversations', supportChatRoutes);
app.use('/api/support/tickets', supportTicketRoutes);
app.use('/api/admin/support/conversations', adminSupportChatRoutes);
app.use('/api/admin/support/tickets', adminSupportTicketRoutes);
app.use('/api/services', publicServiceRoutes);
app.use('/api/faqs', publicFaqRoutes);
app.use('/api/contact', publicContactRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.' });
});

app.use(errorHandler);

module.exports = app;

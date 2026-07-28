const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('./middlewares/mongoSanitize');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const adminUserManagementRoutes = require('./routes/admin/userManagement.routes');
const adminCoinManagementRoutes = require('./routes/admin/coinManagement.routes');
const adminPackageManagementRoutes = require('./routes/admin/packageManagement.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const miningRoutes = require('./routes/mining.routes');
const withdrawalRoutes = require('./routes/withdrawal.routes');
const walletRoutes = require('./routes/wallet.routes');
const packageRoutes = require('./routes/package.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes');
const supportChatRoutes = require('./routes/supportChat/index');
const supportTicketRoutes = require('./routes/supportTicket/index');
const adminSupportChatRoutes = require('./routes/supportChat/admin');
const adminSupportTicketRoutes = require('./routes/supportTicket/admin');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize);
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserManagementRoutes);
app.use('/api/admin/coins', adminCoinManagementRoutes);
app.use('/api/admin/packages', adminPackageManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/support/chat', supportChatRoutes);
app.use('/api/support/tickets', supportTicketRoutes);
app.use('/api/admin/support/chat', adminSupportChatRoutes);
app.use('/api/admin/support/tickets', adminSupportTicketRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.' });
});

app.use(errorHandler);

module.exports = app;

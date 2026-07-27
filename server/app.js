const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('./middlewares/mongoSanitize');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const adminUserManagementRoutes = require('./routes/admin/userManagement.routes');

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

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.' });
});

app.use(errorHandler);

module.exports = app;

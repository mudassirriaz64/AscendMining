require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const deduplicateConversations = require('./utils/deduplicateConversations');
const initSupportChatSocket = require('./sockets/supportChat');
const initDashboardSocket = require('./sockets/dashboard');
const { startSlaCron } = require('./jobs/supportSlaCheck.cron');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdmin();
  await deduplicateConversations();

  // Create HTTP server from Express app
  const server = http.createServer(app);

  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  // Attach Socket.IO with CORS matching the app
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Initialize support chat socket namespace
  const supportNamespace = initSupportChatSocket(io);
  app.set('supportNamespace', supportNamespace);

  // Initialize dashboard socket namespace
  const dashboardNamespace = initDashboardSocket(io);
  app.set('dashboardNamespace', dashboardNamespace);

  // Start SLA cron (checks every 60s for conversations unanswered > 30 min)
  startSlaCron();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

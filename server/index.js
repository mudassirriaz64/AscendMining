require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const initSupportChatSocket = require('./sockets/supportChat');
const { startSlaCron } = require('./jobs/supportSlaCheck.cron');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  // Create HTTP server from Express app
  const server = http.createServer(app);

  // Attach Socket.IO with CORS matching the app
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Initialize support chat socket namespace
  initSupportChatSocket(io);

  // Start SLA cron (checks every 60s for conversations unanswered > 30 min)
  startSlaCron(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

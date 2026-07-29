const socketAuth = require('../auth');

const initDashboardSocket = (io) => {
  const namespace = io.of('/dashboard');
  namespace.use(socketAuth);

  namespace.on('connection', async (socket) => {
    const { id, role } = socket.user;

    // User-specific room for personal updates
    socket.join(`user:${id}`);

    // Admin room for admin-wide updates
    if (role === 'admin' || role === 'support_agent') {
      socket.join('admin:dashboard');
    }

    // Investor room for investor-wide updates
    if (role === 'investor') {
      socket.join('investor:dashboard');
    }

    // Handle dashboard event subscriptions
    socket.on('subscribe:user:stats', () => {
      socket.join(`user:${id}:stats`);
    });

    socket.on('subscribe:admin:stats', () => {
      if (role === 'admin' || role === 'support_agent') {
        socket.join('admin:stats');
      }
    });

    socket.on('disconnect', () => {
      // Cleanup handled by socket.io
    });
  });

  // Helper functions to emit events from anywhere in the server
  namespace.emitUserUpdate = (userId, event, data) => {
    namespace.to(`user:${userId}`).emit(event, data);
  };

  namespace.emitUserStats = (userId, data) => {
    namespace.to(`user:${userId}:stats`).emit('user:stats', data);
  };

  namespace.emitAdminStats = (data) => {
    namespace.to('admin:stats').emit('admin:stats', data);
  };

  namespace.emitAdminUpdate = (event, data) => {
    namespace.to('admin:dashboard').emit(event, data);
  };

  namespace.emitInvestorUpdate = (event, data) => {
    namespace.to('investor:dashboard').emit(event, data);
  };

  // Specific event emitters
  namespace.emitBalanceUpdate = (userId, balance) => {
    namespace.emitUserUpdate(userId, 'balance:update', { balance });
  };

  namespace.emitDepositUpdate = (userId, deposit) => {
    namespace.emitUserUpdate(userId, 'deposit:update', { deposit });
    namespace.emitAdminUpdate('deposit:new', { ...deposit, userId });
  };

  namespace.emitDepositStatusChange = (userId, deposit) => {
    namespace.emitUserUpdate(userId, 'deposit:status', { deposit });
    namespace.emitAdminUpdate('deposit:status', { ...deposit, userId });
  };

  namespace.emitWithdrawalUpdate = (userId, withdrawal) => {
    namespace.emitUserUpdate(userId, 'withdrawal:update', { withdrawal });
    namespace.emitAdminUpdate('withdrawal:new', { ...withdrawal, userId });
  };

  namespace.emitWithdrawalStatusChange = (userId, withdrawal) => {
    namespace.emitUserUpdate(userId, 'withdrawal:status', { withdrawal });
    namespace.emitAdminUpdate('withdrawal:status', { ...withdrawal, userId });
  };

  namespace.emitPackagePurchase = (userId, userPackage) => {
    namespace.emitUserUpdate(userId, 'package:purchased', { userPackage });
    namespace.emitAdminUpdate('package:purchased', { ...userPackage, userId });
  };

  namespace.emitMiningUpdate = (userId, miningData) => {
    namespace.emitUserUpdate(userId, 'mining:update', miningData);
  };

  namespace.emitNewUser = (user) => {
    namespace.emitAdminUpdate('user:new', { user });
  };

  namespace.emitUserStatusChange = (userId, status) => {
    namespace.emitAdminUpdate('user:status', { userId, status });
  };

  return namespace;
};

module.exports = initDashboardSocket;
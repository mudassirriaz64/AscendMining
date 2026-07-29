const socketAuth = require('../auth');

const initDashboardSocket = (io) => {
  const namespace = io.of('/dashboard');
  namespace.use(socketAuth);

  namespace.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);

    if (role === 'admin' || role === 'support_agent') {
      socket.join('admins');
    }

    socket.on('subscribe:balance', () => {
      socket.join(`balance:${id}`);
    });

    socket.on('unsubscribe:balance', () => {
      socket.leave(`balance:${id}`);
    });

    socket.on('subscribe:mining', () => {
      socket.join(`mining:${id}`);
    });

    socket.on('unsubscribe:mining', () => {
      socket.leave(`mining:${id}`);
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${id}`);
      if (role === 'admin' || role === 'support_agent') {
        socket.leave('admins');
      }
    });
  });

  return namespace;
};

module.exports = initDashboardSocket;
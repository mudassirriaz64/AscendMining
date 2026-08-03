const getDashboardNamespace = (app) => app.get('dashboardNamespace');

const getDashboardSocket = (app) => app.get('dashboardSocket');

const emitBalanceUpdate = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('balance:update', data);
  }
};

const emitMiningUpdate = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('mining:update', data);
  }
};

const emitTransactionUpdate = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('transaction:update', data);
  }
};

const emitAdminStatsUpdate = (app, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to('admins').emit('admin:stats:update', data);
  }
};

const emitUserStatusChange = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('user:status:change', data);
    ns.to('admins').emit('admin:user:status', { userId, ...data });
  }
};

const emitDepositStatusChange = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('deposit:status:change', data);
    ns.to('admins').emit('admin:deposit:status', { userId, ...data });
  }
};

const emitWithdrawalUpdate = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('withdrawal:update', data);
  }
};

const emitAdminUpdate = (app, event, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to('admins').emit(event, data);
  }
};

const emitWithdrawalStatusChange = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('withdrawal:status:change', data);
    ns.to('admins').emit('admin:withdrawal:status', { userId, ...data });
  }
};

const emitGlobalMiningSettingsUpdate = (app, miningSettings) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.emit('mining:update', { miningSettings });
  }
};

const emitWalletChangeStatus = (app, userId, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to(`user:${userId}`).emit('wallet:change:status', data);
    ns.to('admins').emit('admin:wallet:change:status', { userId, ...data });
  }
};

const emitWalletChangeNew = (app, data) => {
  const ns = getDashboardNamespace(app);
  if (ns) {
    ns.to('admins').emit('admin:wallet:change:new', data);
  }
};

module.exports = {
  emitBalanceUpdate,
  emitMiningUpdate,
  emitTransactionUpdate,
  emitAdminStatsUpdate,
  emitUserStatusChange,
  emitDepositStatusChange,
  emitWithdrawalUpdate,
  emitAdminUpdate,
  emitWithdrawalStatusChange,
  emitGlobalMiningSettingsUpdate,
  emitWalletChangeStatus,
  emitWalletChangeNew,
};
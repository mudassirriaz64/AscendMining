import { io } from 'socket.io-client';
import { getAccessToken } from './tokenStorage';

let socket;

export const connectDashboardSocket = () => {
  if (socket?.connected) return socket;
  if (socket) {
    socket.connect();
    return socket;
  }
  const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(`${serverUrl}/dashboard`, {
    auth: { token: getAccessToken() },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return socket;
};

export const disconnectDashboardSocket = () => {
  socket?.disconnect();
  socket = undefined;
};

export const getDashboardSocket = () => socket;

export const updateDashboardSocketToken = (newToken) => {
  if (socket) {
    socket.auth.token = newToken;
    socket.disconnect().connect();
  }
};

const listen = (event, handler) => {
  const s = connectDashboardSocket();
  s.on(event, handler);
  return () => s.off(event, handler);
};

export const onBalanceUpdate = (handler) => listen('balance:update', handler);
export const onMiningUpdate = (handler) => listen('mining:update', handler);
export const onTransactionUpdate = (handler) => listen('transaction:update', handler);
export const onDepositStatusChange = (handler) => listen('deposit:status:change', handler);
export const onWithdrawalUpdate = (handler) => listen('withdrawal:update', handler);
export const onWithdrawalStatusChange = (handler) => listen('withdrawal:status:change', handler);
export const onAdminWithdrawalNew = (handler) => listen('admin:withdrawal:new', handler);
export const onAdminWithdrawalApproved = (handler) => listen('admin:withdrawal:approved', handler);
export const onAdminWithdrawalRejected = (handler) => listen('admin:withdrawal:rejected', handler);
export const onAdminDepositStatus = (handler) => listen('admin:deposit:status', handler);
export const onAdminStatsUpdate = (handler) => listen('admin:stats:update', handler);
export const onAdminUserStatus = (handler) => listen('admin:user:status', handler);
export const onUserStatusChange = (handler) => listen('user:status:change', handler);

export default {
  connectDashboardSocket,
  disconnectDashboardSocket,
  getDashboardSocket,
  updateDashboardSocketToken,
  onBalanceUpdate,
  onMiningUpdate,
  onTransactionUpdate,
  onDepositStatusChange,
  onWithdrawalUpdate,
  onWithdrawalStatusChange,
  onAdminWithdrawalNew,
  onAdminWithdrawalApproved,
  onAdminWithdrawalRejected,
  onAdminDepositStatus,
  onAdminStatsUpdate,
  onAdminUserStatus,
  onUserStatusChange,
};

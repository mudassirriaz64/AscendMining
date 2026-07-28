import { io } from 'socket.io-client';

let socket;

export const connectSocket = () => {
  if (socket) return socket;
  const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(`${serverUrl}/support`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
  });
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = undefined;
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };

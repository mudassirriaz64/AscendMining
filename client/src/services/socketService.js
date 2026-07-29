import { io } from 'socket.io-client';
import { getAccessToken } from './tokenStorage';

let socket;

export const connectSocket = () => {
  if (socket) return socket;
  const serverUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(`${serverUrl}/support`, {
    auth: {
      token: getAccessToken(),
    },
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

export const updateSocketToken = (newToken) => {
  if (socket) {
    socket.auth.token = newToken;
    socket.disconnect().connect();
  }
};

export default { connectSocket, disconnectSocket, getSocket, updateSocketToken };

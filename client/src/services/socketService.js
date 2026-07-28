import { io } from 'socket.io-client';

let socket = null;

/**
 * Get the stored JWT access token from cookies.
 * We read it via document.cookie because the cookie is httpOnly=false for the accessToken
 * (only the refresh token is httpOnly).
 * Fall back to localStorage if needed.
 */
const getToken = () => {
  // Try to read from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split('=');
    if (key === 'accessToken') return decodeURIComponent(val);
  }
  return null;
};

/**
 * Connect to the /support namespace.
 * @param {string} token  JWT access token
 */
export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  socket = io(`${serverUrl}/support`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };

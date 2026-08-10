import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://chat-flow-backend-53ra.onrender.com';
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const initSocket = (user) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      transports: ['polling', 'websocket'],
      withCredentials: true
    });
  }

  if (socket && user) {
    if (socket.connected) {
      socket.emit('user_connected', user);
    } else {
      socket.once('connect', () => {
        socket.emit('user_connected', user);
      });
    }
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

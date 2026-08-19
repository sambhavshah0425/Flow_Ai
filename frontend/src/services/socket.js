import { io } from 'socket.io-client';

const URL = window.location.origin.includes('5173')
  ? 'http://localhost:5000'
  : window.location.origin;

export const socket = io(URL, {
  autoConnect: false,
  reconnection: true
});

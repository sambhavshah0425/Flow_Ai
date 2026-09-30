import { io } from 'socket.io-client';

// Same origin as the page: in development Vite proxies /socket.io to the
// backend (see vite.config.js), so this works whichever port Vite picks.
export const socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true
});

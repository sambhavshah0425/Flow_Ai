import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../config/security.js';
import { isDBConnected } from '../config/db.js';
import { RevokedToken } from '../models/RevokedToken.js';
import { memoryRevokedTokens } from '../controllers/authController.js';

let ioInstance = null;

// The engine's run-trigger and authorizer, registered by the execution controller at startup.
// Kept as registered callbacks (rather than direct imports) so the socket
// layer has no dependency on the execution engine.
let executionStarter = null;
let executionAuthorizer = null;

export function registerExecutionStarter(fn) {
  executionStarter = fn;
}

export function registerExecutionAuthorizer(fn) {
  executionAuthorizer = fn;
}

export function initSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO authentication middleware (Only handshake.auth, no query fallback)
  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      // Check if token is blacklisted/revoked
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      if (isDBConnected()) {
        const revoked = await RevokedToken.findOne({ tokenHash });
        if (revoked) {
          return next(new Error('Authentication error: Token revoked'));
        }
      } else {
        if (memoryRevokedTokens.has(tokenHash)) {
          return next(new Error('Authentication error: Token revoked'));
        }
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // Attach authenticated user details
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${socket.user?.userId})`);

    // Join room for specific execution stream
    socket.on('join_execution', async (executionId) => {
      if (executionId && executionAuthorizer) {
        const authorized = await executionAuthorizer(executionId, socket.user.userId);
        if (!authorized) {
          console.warn(`[Socket.IO] Unauthorized join attempt by user ${socket.user.userId} for execution ${executionId}`);
          socket.emit('error', { message: 'Unauthorized access to execution.' });
          return;
        }
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: execution:${executionId}`);
      }
    });

    socket.on('leave_execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left room: execution:${executionId}`);
      }
    });

    // Handshake: the client joins the room first, then fires this to kick off the
    // run. Because emits over a single socket are ordered, the client is already
    // in the room before the first node event is emitted — so nothing is missed.
    socket.on('start_execution', async (executionId) => {
      if (executionId && executionStarter && executionAuthorizer) {
        const authorized = await executionAuthorizer(executionId, socket.user.userId);
        if (!authorized) {
          console.warn(`[Socket.IO] Unauthorized start attempt by user ${socket.user.userId} for execution ${executionId}`);
          socket.emit('error', { message: 'Unauthorized access to execution.' });
          return;
        }
        console.log(`[Socket.IO] Socket ${socket.id} starting execution: ${executionId}`);
        executionStarter(executionId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

/**
 * Emit an execution event to subscribers of an execution room
 */
export function emitExecutionEvent(executionId, eventName, payload) {
  if (ioInstance && executionId) {
    ioInstance.to(`execution:${executionId}`).emit(eventName, payload);
  }
}

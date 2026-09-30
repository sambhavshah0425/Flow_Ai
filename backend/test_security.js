import './config/loadEnv.js';
import http from 'http';
import { io as Client } from 'socket.io-client';
import axios from 'axios';
import mongoose from 'mongoose';
import { app } from './app.js';
import { initSocketServer } from './socket/socketServer.js';
import { connectDB, isDBConnected } from './config/db.js';
import { User } from './models/User.js';
import { Workflow } from './models/Workflow.js';
import { Execution } from './models/Execution.js';
import { RevokedToken } from './models/RevokedToken.js';
import { Secret } from './models/Secret.js';

const PORT = 5199;
const API_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=======================================================');
  console.log(' Starting Security & Cross-User Authorization Tests');
  console.log('=======================================================');

  // 1. Start test server
  const server = http.createServer(app);
  initSocketServer(server);
  await connectDB();
  
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Running on port ${PORT}`);

  // Clean DB if connected
  if (isDBConnected()) {
    console.log('[Test Server] Cleaning test collections in DB...');
    await User.deleteMany({ email: /test-.*@flowforge\.com/ });
    await RevokedToken.deleteMany({});
  }

  let tokenA, tokenB;
  let userIdA, userIdB;
  let workflowIdA;
  let executionIdA;

  try {
    // 2. Register User A
    const resRegA = await axios.post(`${API_URL}/auth/register`, {
      name: 'User A',
      email: 'test-usera@flowforge.com',
      password: 'password123'
    });
    tokenA = resRegA.data.token;
    userIdA = resRegA.data.user.id;
    console.log('✅ Registered User A');

    // 3. Register User B
    const resRegB = await axios.post(`${API_URL}/auth/register`, {
      name: 'User B',
      email: 'test-userb@flowforge.com',
      password: 'password123'
    });
    tokenB = resRegB.data.token;
    userIdB = resRegB.data.user.id;
    console.log('✅ Registered User B');

    const headersA = { headers: { Authorization: `Bearer ${tokenA}` } };
    const headersB = { headers: { Authorization: `Bearer ${tokenB}` } };

    // 4. User A creates Workflow A
    const resWfA = await axios.post(`${API_URL}/workflows`, {
      name: 'Workflow A',
      description: 'Owned by A',
      nodes: [
        { id: 'node-1', type: 'text', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }
      ],
      edges: []
    }, headersA);
    workflowIdA = resWfA.data.workflow._id || resWfA.data.workflow.id;
    console.log(`✅ User A created Workflow A: ${workflowIdA}`);

    // 5. Cross-User Workflow Authorization Checks (User B tries to access A's workflow)
    console.log('\n--- Checking Cross-User Workflow Matrix ---');
    try {
      await axios.get(`${API_URL}/workflows/${workflowIdA}`, headersB);
      throw new Error('❌ FAIL: User B read User A\'s workflow');
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        console.log('✅ PASS: User B blocked from reading Workflow A (Returned 404/403)');
      } else {
        throw err;
      }
    }

    try {
      await axios.put(`${API_URL}/workflows/${workflowIdA}`, { name: 'Hacked by B' }, headersB);
      throw new Error('❌ FAIL: User B updated User A\'s workflow');
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        console.log('✅ PASS: User B blocked from updating Workflow A (Returned 404/403)');
      } else {
        throw err;
      }
    }

    try {
      await axios.delete(`${API_URL}/workflows/${workflowIdA}`, headersB);
      throw new Error('❌ FAIL: User B deleted User A\'s workflow');
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        console.log('✅ PASS: User B blocked from deleting Workflow A (Returned 404/403)');
      } else {
        throw err;
      }
    }

    // 6. Cross-User Execution Authorization Checks
    console.log('\n--- Checking Cross-User Execution Matrix ---');
    // User A runs Workflow A
    const resExecA = await axios.post(`${API_URL}/executions/run`, {
      workflowId: workflowIdA
    }, headersA);
    executionIdA = resExecA.data.executionId;
    console.log(`✅ User A ran Workflow A -> Execution ID: ${executionIdA}`);

    // User B tries to get details of Execution A
    try {
      await axios.get(`${API_URL}/executions/${executionIdA}`, headersB);
      throw new Error('❌ FAIL: User B read User A\'s execution details');
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        console.log('✅ PASS: User B blocked from reading Execution A details (Returned 404/403)');
      } else {
        throw err;
      }
    }

    // 7. Ad-hoc Workflow Sanitization and Validation
    console.log('\n--- Checking Ad-Hoc Workflow Validation ---');
    // Valid ad-hoc run
    const resAdHocOk = await axios.post(`${API_URL}/executions/run`, {
      workflowData: {
        name: 'Ad hoc',
        nodes: [{ id: 'n1', type: 'text', position: { x: 10, y: 10 }, data: {} }],
        edges: []
      }
    }, headersA);
    console.log(`✅ PASS: Valid ad-hoc run succeeded -> Exec ID: ${resAdHocOk.data.executionId}`);

    // Invalid nodes structure ad-hoc run
    try {
      await axios.post(`${API_URL}/executions/run`, {
        workflowData: {
          name: 'Invalid ad hoc',
          nodes: 'not-an-array',
          edges: []
        }
      }, headersA);
      throw new Error('❌ FAIL: Ad-hoc execution accepted non-array nodes');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ PASS: Rejected invalid nodes array format (Returned 400)');
      } else {
        throw err;
      }
    }

    // Malformed node structure ad-hoc run
    try {
      await axios.post(`${API_URL}/executions/run`, {
        workflowData: {
          name: 'Malformed nodes',
          nodes: [{ id: '', type: 'ollama' }],
          edges: []
        }
      }, headersA);
      throw new Error('❌ FAIL: Ad-hoc execution accepted malformed nodes');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ PASS: Rejected malformed node schema (Returned 400)');
      } else {
        throw err;
      }
    }

    // 8. Socket.IO Authorization Checks
    console.log('\n--- Checking Socket.IO Authentication & Room Subscription ---');
    // Test Socket connection without token
    await new Promise((resolve, reject) => {
      const socket = Client(SOCKET_URL, { autoConnect: false });
      socket.connect();
      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('❌ FAIL: Socket connected without authentication token'));
      });
      socket.on('connect_error', (err) => {
        console.log(`✅ PASS: Socket connection rejected without token: "${err.message}"`);
        resolve();
      });
    });

    // Test Socket connection with invalid token
    await new Promise((resolve, reject) => {
      const socket = Client(SOCKET_URL, {
        auth: { token: 'invalid-jwt-token' },
        autoConnect: false
      });
      socket.connect();
      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('❌ FAIL: Socket connected with invalid token'));
      });
      socket.on('connect_error', (err) => {
        console.log(`✅ PASS: Socket connection rejected with invalid token: "${err.message}"`);
        resolve();
      });
    });

    // Test Socket connection with User B token subscribing to User A's execution room
    await new Promise((resolve, reject) => {
      const socketB = Client(SOCKET_URL, {
        auth: { token: tokenB },
        autoConnect: false
      });
      socketB.connect();
      socketB.on('connect', () => {
        console.log('⚡ User B socket connected');
        // Join User A's execution
        socketB.emit('join_execution', executionIdA);
      });
      socketB.on('error', (err) => {
        console.log(`✅ PASS: User B socket unauthorized to join Execution A: "${err.message}"`);
        socketB.disconnect();
        resolve();
      });
      socketB.on('connect_error', (err) => {
        socketB.disconnect();
        reject(err);
      });
    });

    // Test Socket connection with User A token subscribing to User A's execution room
    await new Promise((resolve, reject) => {
      const socketA = Client(SOCKET_URL, {
        auth: { token: tokenA },
        autoConnect: false
      });
      socketA.connect();
      socketA.on('connect', () => {
        console.log('⚡ User A socket connected');
        socketA.emit('join_execution', executionIdA);
        // Wait briefly for join to establish
        setTimeout(() => {
          console.log('✅ PASS: User A successfully subscribed to Execution A room (no auth errors emitted)');
          socketA.disconnect();
          resolve();
        }, 500);
      });
      socketA.on('error', (err) => {
        socketA.disconnect();
        reject(new Error(`❌ FAIL: User A socket failed joining owned execution: ${err.message}`));
      });
    });

    // 9. Token Revocation Check (Logout)
    console.log('\n--- Checking Logout and Token Revocation ---');
    // User A calls logout
    await axios.post(`${API_URL}/auth/logout`, {}, headersA);
    console.log('✅ Logout API called for User A');

    // Attempt to access me endpoint with logged out token
    try {
      await axios.get(`${API_URL}/auth/me`, headersA);
      throw new Error('❌ FAIL: API request accepted revoked token');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ PASS: API request using revoked token blocked (Returned 401)');
      } else {
        throw err;
      }
    }

    console.log('\n=======================================================');
    console.log(' 🎉 ALL SECURITY & AUTHORIZATION TESTS PASSED SUCCESSFULLY! ');
    console.log('=======================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  } finally {
    // Tear down
    server.close();
    if (isDBConnected()) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runTests();

import { create } from 'zustand';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const useExecutionStore = create((set, get) => ({
  activeExecutionId: null,
  isExecuting: false,
  nodeStates: {},    // Map of nodeId -> 'idle' | 'running' | 'completed' | 'failed'
  nodeOutputs: {},   // Map of nodeId -> outputPayload
  logs: [],
  metrics: null,
  executionHistory: [],
  loadingHistory: false,

  setNodeState: (nodeId, status, output = null) => {
    set((state) => ({
      nodeStates: { ...state.nodeStates, [nodeId]: status },
      ...(output && { nodeOutputs: { ...state.nodeOutputs, [nodeId]: output } })
    }));
  },

  addLog: (log) => {
    set((state) => ({
      logs: [log, ...state.logs]
    }));
  },

  resetExecution: () => {
    set({
      activeExecutionId: null,
      isExecuting: false,
      nodeStates: {},
      nodeOutputs: {},
      logs: [],
      metrics: null
    });
  },

  runCurrentWorkflow: async (workflowData) => {
    get().resetExecution();
    set({ isExecuting: true });

    // Connect and attach listeners BEFORE the run is triggered, so we don't
    // miss any node events. Results now stream in via Socket.IO rather than
    // arriving all at once in the HTTP response.
    const token = localStorage.getItem('flowforge_token');
    if (socket.auth?.token !== token || socket.disconnected) {
      socket.disconnect();
      socket.auth = { token };
      socket.connect();
    }
    get().subscribeToSocketEvents();

    try {
      // Phase 1: create the execution record and get its id (nothing runs yet).
      const res = await api.post('/executions/run', { workflowData });
      const { executionId } = res.data;

      set({ activeExecutionId: executionId });

      // Phase 2 handshake: join the room, THEN tell the server to start.
      // Ordering over a single socket is preserved, so we're guaranteed to be
      // subscribed before the first node event fires.
      socket.emit('join_execution', executionId);
      socket.emit('start_execution', executionId);

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({
        isExecuting: false,
        logs: [{ nodeId: 'engine', level: 'error', message: `Execution failed: ${msg}`, timestamp: new Date().toISOString() }]
      });
      return { success: false, error: msg };
    }
  },

  subscribeToSocketEvents: () => {
    socket.off('node.started');
    socket.off('node.completed');
    socket.off('node.failed');
    socket.off('node.skipped');
    socket.off('workflow.completed');
    socket.off('workflow.failed');
    socket.off('connect_error');

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      get().addLog({
        nodeId: 'engine',
        level: 'error',
        message: `Connection error: ${err.message}`,
        timestamp: new Date().toISOString()
      });
      set({ isExecuting: false });
    });

    socket.on('node.started', (data) => {
      get().setNodeState(data.nodeId, 'running');
      get().addLog({
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        level: 'info',
        message: `Node "${data.nodeLabel}" started running...`,
        timestamp: data.timestamp
      });
    });

    socket.on('node.completed', (data) => {
      get().setNodeState(data.nodeId, 'completed', data.output);
      get().addLog({
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        level: 'info',
        message: `Node completed (${data.durationMs}ms)`,
        outputData: data.output,
        timestamp: data.timestamp
      });
    });

    socket.on('node.failed', (data) => {
      get().setNodeState(data.nodeId, 'failed');
      get().addLog({
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        level: 'error',
        message: `Node failed: ${data.error}`,
        timestamp: data.timestamp
      });
    });

    socket.on('node.skipped', (data) => {
      get().setNodeState(data.nodeId, 'skipped');
      get().addLog({
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        level: 'info',
        message: `Node "${data.nodeLabel}" skipped — inactive branch`,
        timestamp: data.timestamp
      });
    });

    socket.on('workflow.completed', (data) => {
      set({ isExecuting: false, metrics: data.metrics, nodeOutputs: data.outputs });
      get().addLog({
        nodeId: 'workflow',
        level: 'info',
        message: `Workflow completed successfully in ${data.metrics?.totalDurationMs || 0}ms`,
        timestamp: data.timestamp
      });
    });

    socket.on('workflow.failed', (data) => {
      set({ isExecuting: false });
      get().addLog({
        nodeId: 'workflow',
        level: 'error',
        message: `Workflow execution failed: ${data.error}`,
        timestamp: data.timestamp
      });
    });
  },

  fetchExecutionHistory: async () => {
    set({ loadingHistory: true });
    try {
      const res = await api.get('/executions');
      set({ executionHistory: res.data.executions || [], loadingHistory: false });
    } catch {
      set({ loadingHistory: false });
    }
  }
}));

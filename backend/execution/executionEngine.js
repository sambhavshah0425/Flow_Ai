import { parseDAG } from './dagParser.js';
import { ExecutionContext } from './executionContext.js';
import { nodeRegistry } from './nodeRegistry.js';
import { registerDefaultHandlers } from './nodeHandlers/index.js';
import { getDecryptedUserSecrets } from '../controllers/secretController.js';
import { Execution } from '../models/Execution.js';
import { Log } from '../models/Log.js';
import { emitExecutionEvent } from '../socket/socketServer.js';
import { isDBConnected } from '../config/db.js';

// Ensure standard handlers are registered
registerDefaultHandlers();

// In-Memory store for executions when DB is offline
export const memoryExecutions = new Map();

// Executions whose record has been created but which are waiting for the client
// to join their Socket.IO room and fire `start_execution` before running.
// This handshake guarantees no node events are emitted before anyone is listening.
export const pendingExecutions = new Map();

/**
 * Create the execution record (DB when connected, otherwise in-memory) and
 * return its id. Shared by the direct-run and streamed (prepared) paths.
 */
async function createExecutionRecord(workflow, workflowId, userId, status) {
  let executionId;
  let dbExecutionRecord = null;

  const userIdStr = userId ? userId.toString() : '';
  if (isDBConnected() && userIdStr.length === 24) {
    try {
      dbExecutionRecord = await Execution.create({
        workflowId,
        userId: userIdStr,
        status,
        startedAt: new Date()
      });
      executionId = dbExecutionRecord._id.toString();
    } catch (err) {
      executionId = `exec_${Date.now()}`;
    }
  }

  if (!executionId) {
    executionId = `exec_${Date.now()}`;
    memoryExecutions.set(executionId, {
      _id: executionId,
      id: executionId,
      workflowId: { _id: workflowId, name: workflow.name || 'Workflow' },
      userId,
      status,
      startedAt: new Date(),
      metrics: {},
      contextOutputs: {},
      logs: []
    });
  }

  return { executionId, dbExecutionRecord };
}

/**
 * Phase 1 of a streamed run: validate the graph and create the execution record,
 * but DO NOT begin executing. The execution is parked in `pendingExecutions`
 * until the client joins its Socket.IO room and fires `start_execution`.
 * Returns the executionId so the HTTP response can hand it to the client.
 */
export async function prepareExecution(workflow, userId) {
  const workflowId = workflow._id || workflow.id || `wf_${Date.now()}`;

  // Validate the DAG up front so malformed graphs fail synchronously (HTTP 4xx),
  // rather than silently in a background task nobody is listening to.
  parseDAG(workflow.nodes || [], workflow.edges || []);

  const { executionId, dbExecutionRecord } = await createExecutionRecord(
    workflow, workflowId, userId, 'pending'
  );

  pendingExecutions.set(executionId, { workflow, userId, dbExecutionRecord, workflowId });
  return { executionId };
}

/**
 * Phase 2: triggered by the `start_execution` socket handshake once the client
 * is subscribed to the room. Runs the prepared workflow in the background and
 * streams live events. Any unexpected error surfaces as a `workflow.failed`.
 */
export async function startPendingExecution(executionId) {
  const pending = pendingExecutions.get(executionId);
  if (!pending) return;
  pendingExecutions.delete(executionId);

  const { workflow, userId, dbExecutionRecord, workflowId } = pending;

  try {
    await executeWorkflow(workflow, userId, { executionId, dbExecutionRecord, workflowId });
  } catch (err) {
    console.error('[Execution] Background run failed:', err);
    emitExecutionEvent(executionId, 'workflow.failed', {
      executionId,
      error: err.message || 'Unknown execution error',
      timestamp: new Date().toISOString()
    });
  }
}

export async function executeWorkflow(workflow, userId, prepared = null) {
  const workflowId = prepared?.workflowId || workflow._id || workflow.id || `wf_${Date.now()}`;
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  // 1. Validate & Parse DAG
  const { orderedNodes, levels } = parseDAG(nodes, edges);

  // 2. Fetch Decrypted User Secrets for Runtime Injection
  let secrets = {};
  if (userId) {
    secrets = await getDecryptedUserSecrets(userId);
  }

  // 3. Resolve Execution Record — reuse a prepared (parked) one, or create fresh
  let executionId;
  let dbExecutionRecord = null;

  if (prepared) {
    executionId = prepared.executionId;
    dbExecutionRecord = prepared.dbExecutionRecord;

    // Flip the parked record from 'pending' to 'running' now that it's actually starting
    if (isDBConnected() && dbExecutionRecord) {
      try {
        await Execution.findByIdAndUpdate(executionId, { status: 'running' });
      } catch {}
    } else {
      const memExec = memoryExecutions.get(executionId);
      if (memExec) memExec.status = 'running';
    }
  } else {
    const record = await createExecutionRecord(workflow, workflowId, userId, 'running');
    executionId = record.executionId;
    dbExecutionRecord = record.dbExecutionRecord;
  }

  // 4. Instantiate ExecutionContext (RAM)
  const context = new ExecutionContext(executionId, workflowId, userId, secrets);

  // Emit workflow started event via Socket.IO
  emitExecutionEvent(executionId, 'workflow.started', {
    executionId,
    workflowId,
    totalNodes: orderedNodes.length,
    timestamp: new Date().toISOString()
  });

  // Branch-routing state (Condition / future Switch nodes).
  // takenBranch maps a node id -> the output handle it chose (e.g. 'true' | 'false').
  const takenBranch = {};
  const skippedNodes = new Set();

  // An edge is "dead" if its source was skipped, or it left a branching node via
  // a handle that wasn't taken. Non-branching sources are never dead by handle.
  const isEdgeDead = (edge) => {
    if (skippedNodes.has(edge.source)) return true;
    if (Object.prototype.hasOwnProperty.call(takenBranch, edge.source)) {
      const handle = edge.sourceHandle || 'true';
      return handle !== takenBranch[edge.source];
    }
    return false;
  };

  // Hard ceiling on a single handler attempt, so a hung network call can never
  // stall the whole run. Per-node override via node.data.timeoutMs still applies
  // (capped at this ceiling) — this is a safety net, not a replacement for it.
  const HARD_ATTEMPT_TIMEOUT_MS = 30000;
  // Local models (Ollama/Qwen) run on this machine's CPU and can legitimately
  // take longer than a cloud API, so they get a wider ceiling.
  const LOCAL_AI_TIMEOUT_MS = 180000;

  function runWithTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Node execution timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (val) => { clearTimeout(timer); resolve(val); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  }

  // Runs a single node's full retry loop and emits its events. Never throws —
  // resolves to { nodeId, success, error } so the caller can await a whole
  // level in parallel via Promise.all without one rejection derailing others.
  async function runSingleNode(node) {
    const nodeId = node.id;
    const nodeType = (node.type || 'text').toLowerCase();
    const nodeLabel = node.data?.label || node.data?.name || nodeType;

    // Retry settings (with defaults). Fresh nodes default to a single attempt —
    // retries are opt-in per node, not a blanket 3x tax on every run.
    const maxRetries = parseInt(node.data?.maxRetries) || 1;
    const retryDelayMs = parseInt(node.data?.retryDelayMs) || 500;
    const backoffFactor = parseFloat(node.data?.backoffFactor) || 2.0;
    const ceilingMs = nodeType === 'ollama' ? LOCAL_AI_TIMEOUT_MS : HARD_ATTEMPT_TIMEOUT_MS;
    const attemptTimeoutMs = Math.min(
      parseInt(node.data?.timeoutMs) || ceilingMs,
      ceilingMs
    );

    let attempt = 0;
    let nodeSuccess = false;
    let lastError = null;

    emitExecutionEvent(executionId, 'node.started', {
      executionId, nodeId, nodeType, nodeLabel,
      timestamp: new Date().toISOString()
    });

    const nodeStartTime = Date.now();

    while (attempt < maxRetries && !nodeSuccess) {
      attempt++;
      try {
        if (attempt > 1) {
          context.metrics.retryCount++;
          const currentDelay = retryDelayMs * Math.pow(backoffFactor, attempt - 2);
          context.addLog(nodeId, nodeType, 'warn', `Retry attempt ${attempt}/${maxRetries} after ${currentDelay}ms delay...`);
          await new Promise(res => setTimeout(res, currentDelay));
        }

        const handler = nodeRegistry.getHandler(nodeType);
        const outputPayload = await runWithTimeout(handler(node, context), attemptTimeoutMs);

        const nodeDurationMs = Date.now() - nodeStartTime;

        context.setNodeOutput(nodeId, nodeType, nodeLabel, outputPayload);
        context.metrics.nodesExecuted++;

        if (outputPayload && outputPayload.branch !== undefined) {
          takenBranch[nodeId] = outputPayload.branch;
        }

        const logEntry = context.addLog(
          nodeId, nodeType, 'info',
          `Node executed successfully (${nodeDurationMs}ms)`,
          outputPayload, nodeDurationMs
        );

        if (isDBConnected() && dbExecutionRecord) {
          try { await Log.create(logEntry); } catch {}
        }

        emitExecutionEvent(executionId, 'node.completed', {
          executionId, nodeId, nodeType,
          output: outputPayload, durationMs: nodeDurationMs,
          timestamp: new Date().toISOString()
        });

        nodeSuccess = true;
      } catch (err) {
        lastError = err;
        context.addLog(nodeId, nodeType, 'error', `Attempt ${attempt} failed: ${err.message}`);
      }
    }

    if (!nodeSuccess) {
      const nodeDurationMs = Date.now() - nodeStartTime;
      const errorMsg = lastError ? lastError.message : 'Unknown node failure';

      if (isDBConnected() && dbExecutionRecord) {
        try {
          await Log.create({
            executionId, nodeId, nodeType, level: 'error',
            message: `Node failed permanently after ${attempt} attempts: ${errorMsg}`,
            durationMs: nodeDurationMs,
            timestamp: new Date().toISOString()
          });
        } catch {}
      }

      emitExecutionEvent(executionId, 'node.failed', {
        executionId, nodeId, nodeType, error: errorMsg,
        timestamp: new Date().toISOString()
      });

      return { nodeId, success: false, error: errorMsg };
    }

    return { nodeId, success: true };
  }

  // 5. Execute Nodes level-by-level: every node within a level has no
  // dependency on any other node in that same level, so they run concurrently.
  // Levels themselves still run in order, since level N+1 may depend on level N.
  let workflowFailed = false;
  let workflowError = null;

  for (const levelNodes of levels) {
    if (workflowFailed) break;

    // Resolve which nodes in this level are actually skipped (inactive branch),
    // using branch decisions already recorded from earlier levels.
    const runnableNodes = [];
    for (const node of levelNodes) {
      const nodeId = node.id;
      const nodeType = (node.type || 'text').toLowerCase();
      const nodeLabel = node.data?.label || node.data?.name || nodeType;
      const incoming = edges.filter((e) => e.target === nodeId);

      if (incoming.length > 0 && incoming.every(isEdgeDead)) {
        skippedNodes.add(nodeId);
        context.addLog(nodeId, nodeType, 'info', 'Node skipped — inactive branch');
        emitExecutionEvent(executionId, 'node.skipped', {
          executionId, nodeId, nodeType, nodeLabel,
          timestamp: new Date().toISOString()
        });
        continue;
      }
      runnableNodes.push(node);
    }

    if (runnableNodes.length === 0) continue;

    // Run every node in this level in parallel.
    const results = await Promise.all(runnableNodes.map(runSingleNode));

    const failed = results.find((r) => !r.success);
    if (failed) {
      workflowFailed = true;
      workflowError = failed.error;
    }
  }

  if (workflowFailed) {
    context.finish('failed', workflowError);

    if (isDBConnected() && dbExecutionRecord) {
      try {
        await Execution.findByIdAndUpdate(executionId, {
          status: 'failed',
          completedAt: new Date(),
          durationMs: context.metrics.totalDurationMs,
          metrics: context.metrics,
          error: workflowError
        });
      } catch {}
    } else {
      const memExec = memoryExecutions.get(executionId);
      if (memExec) {
        memExec.status = 'failed';
        memExec.completedAt = new Date();
        memExec.durationMs = context.metrics.totalDurationMs;
        memExec.metrics = context.metrics;
        memExec.error = workflowError;
        memExec.logs = context.logs;
      }
    }

    emitExecutionEvent(executionId, 'workflow.failed', {
      executionId, error: workflowError,
      timestamp: new Date().toISOString()
    });

    return context;
  }

  // 6. Workflow Completed Successfully
  context.finish('completed');

  if (isDBConnected() && dbExecutionRecord) {
    try {
      await Execution.findByIdAndUpdate(executionId, {
        status: 'completed',
        completedAt: new Date(),
        durationMs: context.metrics.totalDurationMs,
        metrics: context.metrics,
        contextOutputs: context.nodeOutputs
      });
    } catch {}
  } else {
    const memExec = memoryExecutions.get(executionId);
    if (memExec) {
      memExec.status = 'completed';
      memExec.completedAt = new Date();
      memExec.durationMs = context.metrics.totalDurationMs;
      memExec.metrics = context.metrics;
      memExec.contextOutputs = context.nodeOutputs;
      memExec.logs = context.logs;
    }
  }

  emitExecutionEvent(executionId, 'workflow.completed', {
    executionId,
    workflowId,
    status: 'completed',
    metrics: context.metrics,
    outputs: context.nodeOutputs,
    timestamp: new Date().toISOString()
  });

  return context;
}

/**
 * Authorizes that the execution record with executionId belongs to the specified userId.
 */
export async function authorizeExecutionUser(executionId, userId) {
  try {
    if (!executionId || !userId) return false;
    
    if (isDBConnected()) {
      const execution = await Execution.findById(executionId);
      return execution && String(execution.userId) === String(userId);
    } else {
      const exec = memoryExecutions.get(executionId) || pendingExecutions.get(executionId);
      return exec && String(exec.userId) === String(userId);
    }
  } catch (error) {
    console.error(`[Execution Auth Error] Failed to authorize execution ${executionId} for user ${userId}:`, error.message);
    return false;
  }
}

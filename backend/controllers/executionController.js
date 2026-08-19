import { Workflow } from '../models/Workflow.js';
import { Execution } from '../models/Execution.js';
import { Log } from '../models/Log.js';
import { prepareExecution, startPendingExecution, memoryExecutions, authorizeExecutionUser } from '../execution/executionEngine.js';
import { registerExecutionStarter, registerExecutionAuthorizer } from '../socket/socketServer.js';
import { isDBConnected } from '../config/db.js';
import { memoryWorkflows } from './workflowController.js';

// Wire the socket handlers to the engine's background runner and authorizer.
registerExecutionStarter(startPendingExecution);
registerExecutionAuthorizer(authorizeExecutionUser);
export async function runWorkflow(req, res) {
  try {
    const { workflowId, workflowData } = req.body;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    let targetWorkflow = null;

    if (workflowId) {
      if (isDBConnected()) {
        targetWorkflow = await Workflow.findOne({ _id: workflowId, userId });
      } else {
        const memWf = memoryWorkflows.get(workflowId);
        // Only use it if it belongs to the requesting user
        if (memWf && String(memWf.userId) === String(userId)) {
          targetWorkflow = memWf;
        }
      }
    }

    if (!targetWorkflow && workflowData) {
      // Validate structural arrays for ad-hoc run
      if (workflowData.nodes && !Array.isArray(workflowData.nodes)) {
        return res.status(400).json({ success: false, message: 'Workflow nodes must be an array.' });
      }
      if (workflowData.edges && !Array.isArray(workflowData.edges)) {
        return res.status(400).json({ success: false, message: 'Workflow edges must be an array.' });
      }

      // Deeply validate ad-hoc nodes and edges to avoid malformed structures
      if (workflowData.nodes) {
        for (let i = 0; i < workflowData.nodes.length; i++) {
          const node = workflowData.nodes[i];
          if (!node || typeof node !== 'object') {
            return res.status(400).json({ success: false, message: `Node at index ${i} is invalid.` });
          }
          if (typeof node.id !== 'string' || node.id.trim().length === 0) {
            return res.status(400).json({ success: false, message: `Node at index ${i} must have a valid string "id".` });
          }
          if (typeof node.type !== 'string' || node.type.trim().length === 0) {
            return res.status(400).json({ success: false, message: `Node "${node.id}" must have a valid string "type".` });
          }
        }
      }

      if (workflowData.edges) {
        for (let i = 0; i < workflowData.edges.length; i++) {
          const edge = workflowData.edges[i];
          if (!edge || typeof edge !== 'object') {
            return res.status(400).json({ success: false, message: `Edge at index ${i} is invalid.` });
          }
          if (typeof edge.id !== 'string' || edge.id.trim().length === 0) {
            return res.status(400).json({ success: false, message: `Edge at index ${i} must have a valid string "id".` });
          }
          if (typeof edge.source !== 'string' || edge.source.trim().length === 0) {
            return res.status(400).json({ success: false, message: `Edge "${edge.id}" must have a valid string "source".` });
          }
          if (typeof edge.target !== 'string' || edge.target.trim().length === 0) {
            return res.status(400).json({ success: false, message: `Edge "${edge.id}" must have a valid string "target".` });
          }
        }
      }

      targetWorkflow = { ...workflowData, userId };
    }

    if (!targetWorkflow || !targetWorkflow.nodes) {
      return res.status(400).json({ success: false, message: 'Valid workflow ID or workflow definition required.' });
    }

    // Phase 1: validate + create the execution record, but don't run yet.
    // The client joins the Socket.IO room and fires `start_execution` to begin,
    // which streams live node events back (see startPendingExecution).
    const { executionId } = await prepareExecution(targetWorkflow, userId);

    return res.status(202).json({
      success: true,
      executionId,
      status: 'pending'
    });
  } catch (error) {
    console.error('[Execution Controller Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUserExecutions(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const executions = await Execution.find({ userId })
        .populate('workflowId', 'name')
        .sort({ createdAt: -1 })
        .limit(50);

      return res.status(200).json({ success: true, executions });
    } else {
      const execs = Array.from(memoryExecutions.values())
        .filter(e => String(e.userId) === String(userId))
        .reverse();
      return res.status(200).json({ success: true, executions: execs });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getExecutionById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const execution = await Execution.findOne({ _id: id, userId }).populate('workflowId', 'name');
      if (!execution) {
        return res.status(404).json({ success: false, message: 'Execution not found.' });
      }

      const logs = await Log.find({ executionId: id }).sort({ timestamp: 1 });

      return res.status(200).json({ success: true, execution, logs });
    } else {
      const execution = memoryExecutions.get(id);
      if (!execution || String(execution.userId) !== String(userId)) {
        return res.status(404).json({ success: false, message: 'Execution not found.' });
      }
      return res.status(200).json({ success: true, execution, logs: execution.logs || [] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * ExecutionContext acts as the in-memory RAM of an active workflow execution.
 * It stores node outputs, user secrets, variables, metrics, and logs.
 */
export class ExecutionContext {
  constructor(executionId, workflowId, userId, secrets = {}) {
    this.executionId = executionId;
    this.workflowId = workflowId;
    this.userId = userId;
    this.secrets = secrets; // Decrypted key-value pair map
    this.nodeOutputs = {};  // Keyed by nodeId (and node label/type)
    this.variables = {};    // Global workflow variables
    this.logs = [];
    this.metrics = {
      startTime: Date.now(),
      endTime: null,
      totalDurationMs: 0,
      tokensUsed: 0,
      nodesExecuted: 0,
      retryCount: 0,
      memoryMB: 0
    };
    this.status = 'running';
    this.error = null;
  }

  /**
   * Set output payload for a specific node
   */
  setNodeOutput(nodeId, nodeType, nodeLabel, outputData) {
    this.nodeOutputs[nodeId] = outputData;
    
    // Also index by node label (slugified) or type if unique to allow {{pdf_1.text}} or {{pdf.text}} syntax
    if (nodeLabel) {
      const slugLabel = nodeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      this.nodeOutputs[slugLabel] = outputData;
    }
    if (nodeType) {
      this.nodeOutputs[nodeType] = outputData;
    }
  }

  /**
   * Get output payload for a node ID or alias
   */
  getNodeOutput(key) {
    return this.nodeOutputs[key];
  }

  /**
   * Add a log entry
   */
  addLog(nodeId, nodeType, level, message, outputData = null, durationMs = 0) {
    const logEntry = {
      executionId: this.executionId,
      nodeId,
      nodeType,
      level,
      message,
      outputData,
      durationMs,
      timestamp: new Date().toISOString()
    };
    this.logs.push(logEntry);
    return logEntry;
  }

  /**
   * Finalize metrics upon execution completion
   */
  finish(status = 'completed', error = null) {
    this.metrics.endTime = Date.now();
    this.metrics.totalDurationMs = this.metrics.endTime - this.metrics.startTime;
    this.status = status;
    this.error = error;
    return this;
  }
}

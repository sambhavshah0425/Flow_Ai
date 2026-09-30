/**
 * NodeRegistry - Plugin Architecture Registry
 * Maps node types (e.g. 'text', 'pdf', 'ollama', 'api', 'delay', 'download')
 * to execution handlers dynamically.
 */
class NodeRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a node type handler
   * @param {string} type - Unique node type key (e.g., 'ollama')
   * @param {Function} handlerFn - Async function (nodeData, context) => outputPayload
   */
  register(type, handlerFn) {
    if (typeof handlerFn !== 'function') {
      throw new Error(`Handler for node type "${type}" must be a function.`);
    }
    this.handlers.set(type.toLowerCase(), handlerFn);
    console.log(`[NodeRegistry] Registered node handler: "${type}"`);
  }

  /**
   * Get handler for a node type
   */
  getHandler(type) {
    const handler = this.handlers.get(type ? type.toLowerCase() : '');
    if (!handler) {
      throw new Error(`No handler registered for node type: "${type}".`);
    }
    return handler;
  }

  /**
   * List all registered node types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys());
  }
}

export const nodeRegistry = new NodeRegistry();

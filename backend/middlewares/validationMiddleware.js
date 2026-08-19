/**
 * Custom request body and parameter validation middleware.
 */

// Simple regex to check basic email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Name is required and must be a valid string.' });
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password is required and must be at least 6 characters long.' });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  next();
}

export function validateWorkflow(req, res, next) {
  const { name, nodes, edges } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ success: false, message: 'Workflow name must be a non-empty string.' });
  }

  // Nodes validation
  if (nodes !== undefined) {
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ success: false, message: 'Nodes must be an array.' });
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || typeof node !== 'object') {
        return res.status(400).json({ success: false, message: `Node at index ${i} is invalid.` });
      }
      if (typeof node.id !== 'string' || node.id.trim().length === 0) {
        return res.status(400).json({ success: false, message: `Node at index ${i} must have a valid string "id".` });
      }
      if (typeof node.type !== 'string' || node.type.trim().length === 0) {
        return res.status(400).json({ success: false, message: `Node "${node.id}" must have a valid string "type".` });
      }
      if (node.position !== undefined) {
        if (typeof node.position !== 'object' || node.position === null || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          return res.status(400).json({ success: false, message: `Node "${node.id}" must have a valid "position" object with numeric "x" and "y".` });
        }
      }
      if (node.data !== undefined && (typeof node.data !== 'object' || node.data === null)) {
        return res.status(400).json({ success: false, message: `Node "${node.id}" "data" must be an object.` });
      }
    }
  }

  // Edges validation
  if (edges !== undefined) {
    if (!Array.isArray(edges)) {
      return res.status(400).json({ success: false, message: 'Edges must be an array.' });
    }

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
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

  next();
}

export function validateSecret(req, res, next) {
  const { key, value } = req.body;

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Secret key is required.' });
  }

  // Key must contain only alphanumeric characters and underscores
  const keyPattern = /^[A-Z0-9_]+$/i;
  if (!keyPattern.test(key.trim())) {
    return res.status(400).json({ success: false, message: 'Secret key must only contain alphanumeric characters and underscores.' });
  }

  if (value === undefined || value === null || typeof value !== 'string' || value.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Secret value is required and must be a non-empty string.' });
  }

  next();
}

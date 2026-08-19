import { Workflow } from '../models/Workflow.js';
import { isDBConnected } from '../config/db.js';

export const memoryWorkflows = new Map();

export async function createWorkflow(req, res) {
  try {
    const { name, description, nodes, edges } = req.body;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const workflow = await Workflow.create({
        userId,
        name: name || 'Untitled Workflow',
        description: description || '',
        nodes: nodes || [],
        edges: edges || []
      });

      return res.status(201).json({
        success: true,
        workflow
      });
    } else {
      const fakeId = `wf_${Date.now()}`;
      const workflow = {
        _id: fakeId,
        id: fakeId,
        userId,
        name: name || 'Untitled Workflow',
        description: description || '',
        nodes: nodes || [],
        edges: edges || [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryWorkflows.set(fakeId, workflow);
      return res.status(201).json({ success: true, workflow });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUserWorkflows(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const workflows = await Workflow.find({ userId }).sort({ updatedAt: -1 });
      return res.status(200).json({ success: true, workflows });
    } else {
      const userWfs = Array.from(memoryWorkflows.values()).filter(w => String(w.userId) === String(userId));
      return res.status(200).json({ success: true, workflows: userWfs });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWorkflowById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found.' });
      }
      return res.status(200).json({ success: true, workflow });
    } else {
      const workflow = memoryWorkflows.get(id);
      if (!workflow || String(workflow.userId) !== String(userId)) {
        return res.status(404).json({ success: false, message: 'Workflow not found.' });
      }
      return res.status(200).json({ success: true, workflow });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateWorkflow(req, res) {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges } = req.body;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const workflow = await Workflow.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(nodes && { nodes }),
            ...(edges && { edges })
          },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found.' });
      }

      return res.status(200).json({ success: true, workflow });
    } else {
      const existing = memoryWorkflows.get(id);
      if (existing && String(existing.userId) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to workflow.' });
      }
      if (!existing) {
        // Auto create if missing
        const newWf = {
          _id: id,
          id,
          userId,
          name: name || 'Untitled Workflow',
          description: description || '',
          nodes: nodes || [],
          edges: edges || [],
          version: 1,
          updatedAt: new Date()
        };
        memoryWorkflows.set(id, newWf);
        return res.status(200).json({ success: true, workflow: newWf });
      }
      if (name) existing.name = name;
      if (description !== undefined) existing.description = description;
      if (nodes) existing.nodes = nodes;
      if (edges) existing.edges = edges;
      existing.version = (existing.version || 1) + 1;
      existing.updatedAt = new Date();
      memoryWorkflows.set(id, existing);
      return res.status(200).json({ success: true, workflow: existing });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteWorkflow(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const workflow = await Workflow.findOneAndDelete({ _id: id, userId });
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found.' });
      }
      return res.status(200).json({ success: true, message: 'Workflow deleted successfully.' });
    } else {
      const existing = memoryWorkflows.get(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Workflow not found.' });
      }
      if (String(existing.userId) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to workflow.' });
      }
      memoryWorkflows.delete(id);
      return res.status(200).json({ success: true, message: 'Workflow deleted successfully.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

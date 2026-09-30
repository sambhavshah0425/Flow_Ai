import { create } from 'zustand';
import { api } from '../services/api';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export const DEFAULT_NODES = [
  {
    id: 'text_1',
    type: 'text',
    position: { x: 100, y: 150 },
    data: { label: 'Input Prompt', text: 'Summarize key insights regarding AI workflow automation.' }
  },
  {
    id: 'ollama_1',
    type: 'ollama',
    position: { x: 450, y: 150 },
    data: { label: 'Local AI (Qwen)', prompt: '{{text_1.text}}', model: 'qwen3:1.7b', temperature: 0.7 }
  },
  {
    id: 'download_1',
    type: 'download',
    position: { x: 800, y: 150 },
    data: { label: 'Download Summary', text: '{{ollama_1.text}}', fileName: 'ai_summary.txt' }
  }
];

const DEFAULT_EDGES = [
  { id: 'e1', source: 'text_1', target: 'ollama_1', type: 'smoothstep', animated: true },
  { id: 'e2', source: 'ollama_1', target: 'download_1', type: 'smoothstep', animated: true }
];

// True when the canvas still holds the untouched starter template (positions and
// selection may have changed, but no node was added, removed or edited).
export function isStarterCanvas(nodes) {
  return (
    nodes.length === DEFAULT_NODES.length &&
    nodes.every((n, i) => n.id === DEFAULT_NODES[i].id && JSON.stringify(n.data) === JSON.stringify(DEFAULT_NODES[i].data))
  );
}

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  selectedNodeId: null,
  isSaving: false,
  isGeneratingWorkflow: false,
  generationError: null,
  loadingWorkflows: false,
  error: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  generateWorkflowFromPrompt: async (prompt, autoRun = false) => {
    set({ isGeneratingWorkflow: true, generationError: null });
    try {
      const res = await api.post('/workflows/generate-from-prompt', { prompt, autoRun });
      const wf = res.data.workflow;
      
      set({
        currentWorkflowId: null,
        workflowName: wf.name || 'AI Generated Workflow',
        nodes: wf.nodes && wf.nodes.length > 0 ? wf.nodes : DEFAULT_NODES,
        edges: wf.edges && wf.edges.length > 0 ? wf.edges : DEFAULT_EDGES,
        selectedNodeId: null,
        isGeneratingWorkflow: false,
        generationError: null
      });

      return { success: true, workflow: wf, autoRun };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      set({ isGeneratingWorkflow: false, generationError: msg });
      return { success: false, error: msg };
    }
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes)
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges)
    }));
  },
  
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...dataUpdate } } : n
      )
    }));
  },

  addNode: (nodeType, position = { x: 250, y: 250 }) => {
    const id = `${nodeType}_${Date.now().toString().slice(-4)}`;
    const newNode = {
      id,
      type: nodeType,
      position,
      data: {
        label: `${nodeType.toUpperCase()} Node`,
        ...(nodeType === 'text' && { text: 'Sample text' }),
        ...(nodeType === 'ollama' && { prompt: 'Summarize: {{text_1.text}}', model: 'qwen3:1.7b', temperature: 0.7 }),
        ...(nodeType === 'api' && { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' }),
        ...(nodeType === 'condition' && { leftValue: '{{text_1.text}}', operator: 'contains', rightValue: 'yes' }),
        ...(nodeType === 'embed' && { text: '{{pdf.text}}', chunkSize: 900 }),
        ...(nodeType === 'retrieve' && { query: 'What is this document about?', topK: 4 }),
        ...(nodeType === 'email' && {
          to: '',
          subject: 'FlowForge notification',
          body: '{{ollama.text}}',
          smtpHost: '{{secrets.SMTP_HOST}}',
          smtpPort: 587,
          smtpUser: '{{secrets.SMTP_USER}}',
          smtpPass: '{{secrets.SMTP_PASS}}'
        }),
        ...(nodeType === 'delay' && { delayMs: 1000 }),
        ...(nodeType === 'download' && { fileName: 'output.txt', text: 'Output data' }),
        ...(nodeType === 'pdf' && { fileName: 'document.pdf', text: 'PDF content' })
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    }));
  },

  fetchWorkflows: async () => {
    set({ loadingWorkflows: true });
    try {
      const res = await api.get('/workflows');
      set({ workflows: res.data.workflows || [], loadingWorkflows: false });
    } catch (err) {
      set({ error: err.message, loadingWorkflows: false });
    }
  },

  loadWorkflow: (workflow) => {
    set({
      currentWorkflowId: workflow._id,
      workflowName: workflow.name,
      nodes: workflow.nodes && workflow.nodes.length > 0 ? workflow.nodes : DEFAULT_NODES,
      edges: workflow.edges && workflow.edges.length > 0 ? workflow.edges : DEFAULT_EDGES,
      selectedNodeId: null
    });
  },

  saveWorkflow: async () => {
    const { currentWorkflowId, workflowName, nodes, edges } = get();
    set({ isSaving: true });
    try {
      let res;
      if (currentWorkflowId) {
        res = await api.put(`/workflows/${currentWorkflowId}`, {
          name: workflowName,
          nodes,
          edges
        });
      } else {
        res = await api.post('/workflows', {
          name: workflowName,
          nodes,
          edges
        });
      }
      const saved = res.data.workflow;
      set({ currentWorkflowId: saved._id, isSaving: false });
      return true;
    } catch (err) {
      set({ error: err.message, isSaving: false });
      return false;
    }
  },

  // Drops a workflow produced by the chat copilot onto the canvas. It is left
  // unsaved (currentWorkflowId null) so "Save" creates a new workflow.
  applyGeneratedWorkflow: (workflow) => {
    set({
      currentWorkflowId: null,
      workflowName: workflow.name || 'AI Generated Workflow',
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      selectedNodeId: null
    });
  },

  resetCanvas: () => {
    set({
      currentWorkflowId: null,
      workflowName: 'New Workflow',
      nodes: DEFAULT_NODES,
      edges: DEFAULT_EDGES,
      selectedNodeId: null
    });
  }
}));

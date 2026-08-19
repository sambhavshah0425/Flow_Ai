import { create } from 'zustand';
import { api } from '../services/api';

const DEFAULT_NODES = [
  {
    id: 'text_1',
    type: 'text',
    position: { x: 100, y: 150 },
    data: { label: 'Input Prompt', text: 'Summarize key insights regarding AI workflow automation.' }
  },
  {
    id: 'gemini_1',
    type: 'gemini',
    position: { x: 450, y: 150 },
    data: { label: 'Gemini AI', prompt: '{{text_1.text}}', model: 'gemini-flash-latest', temperature: 0.7, maxRetries: 3, retryDelayMs: 1500 }
  },
  {
    id: 'download_1',
    type: 'download',
    position: { x: 800, y: 150 },
    data: { label: 'Download Summary', text: '{{gemini_1.text}}', fileName: 'ai_summary.txt' }
  }
];

const DEFAULT_EDGES = [
  { id: 'e1', source: 'text_1', target: 'gemini_1', type: 'smoothstep', animated: true },
  { id: 'e2', source: 'gemini_1', target: 'download_1', type: 'smoothstep', animated: true }
];

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  selectedNodeId: null,
  isSaving: false,
  loadingWorkflows: false,
  error: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
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
        ...(nodeType === 'gemini' && { prompt: 'Process input text', model: 'gemini-flash-latest', maxRetries: 3, retryDelayMs: 1500 }),
        ...(nodeType === 'api' && { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' }),
        ...(nodeType === 'condition' && { leftValue: '{{text_1.text}}', operator: 'contains', rightValue: 'yes' }),
        ...(nodeType === 'embed' && { text: '{{pdf.text}}', chunkSize: 900 }),
        ...(nodeType === 'retrieve' && { query: 'What is this document about?', topK: 4 }),
        ...(nodeType === 'email' && {
          to: '',
          subject: 'FlowForge notification',
          body: '{{gemini.text}}',
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

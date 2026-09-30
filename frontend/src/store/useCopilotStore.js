import { create } from 'zustand';
import { api } from '../services/api';
import { useWorkflowStore, isStarterCanvas } from './useWorkflowStore';
import { useExecutionStore } from './useExecutionStore';

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! Tell me what you want to automate — e.g. \"Summarize a PDF and email it to me\". I'll ask if I need anything, then build the workflow on your canvas.",
  local: true // UI-only, never sent to the model
};

let nextId = 1;
const msg = (role, content, extra = {}) => ({ id: `m${nextId++}`, role, content, ...extra });

export const useCopilotStore = create((set, get) => ({
  isOpen: false,
  messages: [WELCOME],
  isSending: false,
  status: null, // { online, model, modelInstalled } from /copilot/status

  open: async () => {
    set({ isOpen: true });
    await get().checkStatus();
    // Pre-load Qwen and its instructions while the user is still typing, so
    // the first message doesn't pay the ~30-60s model-load + prompt-read cost.
    const { status } = get();
    if (status?.online && status?.modelInstalled) {
      api.post('/copilot/warmup').catch(() => {});
    }
  },
  close: () => set({ isOpen: false }),

  checkStatus: async () => {
    try {
      const res = await api.get('/copilot/status');
      set({ status: res.data });
    } catch {
      set({ status: { online: false } });
    }
  },

  resetChat: () => set({ messages: [WELCOME] }),

  sendMessage: async (text) => {
    const content = text.trim();
    if (!content || get().isSending) return;

    const userMsg = msg('user', content);
    set((s) => ({ messages: [...s.messages, userMsg], isSending: true }));

    // Only real conversation turns go to the model (not the welcome text or error notices).
    const history = get().messages
      .filter((m) => !m.local && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: m.content }));

    const { workflowName, nodes, edges } = useWorkflowStore.getState();
    // Don't show the model the untouched starter template, or it "edits" it
    // instead of building what the user asked for.
    const currentWorkflow = isStarterCanvas(nodes) ? undefined : { name: workflowName, nodes, edges };

    try {
      const res = await api.post('/copilot/chat', { messages: history, currentWorkflow });
      const { action, reply, workflow } = res.data;

      if (action === 'build' && workflow) {
        useExecutionStore.getState().resetExecution(); // clear old run badges
        useWorkflowStore.getState().applyGeneratedWorkflow(workflow);
        set((s) => ({
          messages: [...s.messages, msg('assistant', reply, { built: { name: workflow.name, nodeCount: workflow.nodes.length } })]
        }));
      } else {
        set((s) => ({ messages: [...s.messages, msg('assistant', reply)] }));
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong.';
      set((s) => ({ messages: [...s.messages, msg('assistant', message, { error: true, local: true })] }));
      get().checkStatus();
    } finally {
      set({ isSending: false });
    }
  }
}));

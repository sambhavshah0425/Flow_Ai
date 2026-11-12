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
let chatEpoch = 0;
let activeController = null;
const msg = (role, content, extra = {}) => ({ id: `m${nextId++}`, role, content, ...extra });

export const useCopilotStore = create((set, get) => ({
  isOpen: false,
  messages: [WELCOME],
  isSending: false,
  isCheckingStatus: false,
  status: null, // { online, model, modelInstalled } from /copilot/status
  savingMsgId: null,
  savedMsgIds: {},
  totalSavedExamples: null,

  open: async () => {
    set({ isOpen: true });
    await get().recheckConnection();
  },
  close: () => set({ isOpen: false }),

  checkStatus: async () => {
    set({ isCheckingStatus: true });
    try {
      const res = await api.get('/copilot/status');
      set({ status: res.data, isCheckingStatus: false });
      return res.data;
    } catch {
      const offline = { online: false, modelInstalled: false };
      set({ status: offline, isCheckingStatus: false });
      return offline;
    }
  },

  recheckConnection: async () => {
    const status = await get().checkStatus();
    // Pre-load Qwen and its instructions while the user is still typing, so
    // the first message doesn't pay the ~30-60s model-load + prompt-read cost.
    if (status?.online && status?.modelInstalled) {
      api.post('/copilot/warmup').catch(() => {});
    }
    return status;
  },

  resetChat: () => {
    chatEpoch += 1;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    set({ messages: [WELCOME], isSending: false });
  },

  sendMessage: async (text) => {
    const content = text.trim();
    if (!content || get().isSending) return;

    const epoch = chatEpoch;
    const controller = new AbortController();
    activeController = controller;

    const userMsg = msg('user', content);
    set((s) => ({ messages: [...s.messages, userMsg], isSending: true }));

    // Only real conversation turns go to the model (not the welcome text or error notices).
    // Keep the most recent 12 turns to match the backend context window.
    const history = get().messages
      .filter((m) => !m.local && (m.role === 'user' || m.role === 'assistant'))
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const { workflowName, nodes, edges } = useWorkflowStore.getState();
    // Don't show the model the untouched starter template, or it "edits" it
    // instead of building what the user asked for.
    const currentWorkflow = isStarterCanvas(nodes) ? undefined : { name: workflowName, nodes, edges };

    try {
      const res = await api.post(
        '/copilot/chat',
        { messages: history, currentWorkflow },
        { signal: controller.signal }
      );
      if (epoch !== chatEpoch) return;

      const { action, reply, workflow } = res.data;

      if (action === 'build' && workflow) {
        useExecutionStore.getState().resetExecution(); // clear old run badges
        useWorkflowStore.getState().applyGeneratedWorkflow(workflow);
        set((s) => ({
          messages: [
            ...s.messages,
            msg('assistant', reply, { action: 'build', built: { name: workflow.name, nodeCount: workflow.nodes.length } })
          ]
        }));
      } else {
        set((s) => ({ messages: [...s.messages, msg('assistant', reply, { action: 'ask' })] }));
      }
    } catch (err) {
      if (epoch !== chatEpoch || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }
      const message = err.response?.status === 401
        ? 'Your session expired — please sign in again to keep chatting.'
        : (err.response?.data?.message || err.message || 'Something went wrong.');
      set((s) => ({ messages: [...s.messages, msg('assistant', message, { error: true, local: true })] }));
      get().checkStatus();
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
      if (epoch === chatEpoch) {
        set({ isSending: false });
      }
    }
  },

  saveExampleForMessage: async (messageId) => {
    const { messages, savingMsgId, savedMsgIds } = get();
    if (savingMsgId || savedMsgIds[messageId]) return;

    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx <= 0) return;

    const target = messages[idx];
    const prefix = messages
      .slice(0, idx)
      .filter((m) => !m.local && (m.role === 'user' || m.role === 'assistant'))
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    if (prefix.length === 0 || prefix[prefix.length - 1].role !== 'user') return;

    const action = target.built ? 'build' : target.action || 'ask';
    const { workflowName, nodes, edges } = useWorkflowStore.getState();
    const workflow = action === 'build' ? { name: workflowName, nodes, edges } : undefined;

    set({ savingMsgId: messageId });
    try {
      const res = await api.post('/copilot/save-example', {
        messages: prefix,
        reply: target.content,
        action,
        workflow
      });
      set((s) => ({
        savingMsgId: null,
        savedMsgIds: { ...s.savedMsgIds, [messageId]: true },
        totalSavedExamples: res.data.savedCount ?? s.totalSavedExamples
      }));
    } catch {
      set({ savingMsgId: null });
    }
  }
}));

import React, { useEffect, useRef, useState } from 'react';
import { useCopilotStore } from '../store/useCopilotStore';
import { Bot, X, Send, RotateCcw, Loader2, CheckCircle2, AlertTriangle, User, RefreshCw, BookmarkPlus, Check } from 'lucide-react';

const SUGGESTIONS = [
  'Summarize a PDF and email me the summary',
  'Fetch a post from an API and write a tweet about it',
  'Answer questions about a document I upload'
];

function StatusBadge({ status }) {
  if (!status) return <span className="text-[10px] text-slate-500">checking…</span>;
  const ready = status.online && status.modelInstalled;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono ${ready ? 'text-emerald-400' : 'text-amber-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {ready ? status.model : status.online ? 'model missing' : 'offline'}
    </span>
  );
}

function SetupHint({ status, onRetry, isChecking }) {
  if (!status || (status.online && status.modelInstalled)) return null;
  const model = status.model || 'qwen3:1.7b';
  return (
    <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1.5">
      <div className="font-semibold flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {status.online ? `Model ${model} is not installed` : 'Ollama is not running'}
        </span>
        <button
          onClick={onRetry}
          disabled={isChecking}
          className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
          title="Recheck Ollama status"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
      {!status.online && <p>Install Ollama from <span className="font-mono">ollama.com</span> and start it.</p>}
      <p>Then run in a terminal:</p>
      <code className="block font-mono bg-dark-950 text-teal-300 px-2 py-1 rounded">ollama pull {model}</code>
    </div>
  );
}

function Message({ m, isSaving, isSaved, onSaveExample }) {
  const isUser = m.role === 'user';
  const canSave = !isUser && !m.local && !m.error;
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${isUser ? 'bg-brand-600' : m.error ? 'bg-red-500/20' : 'bg-teal-500/20'}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className={`w-3.5 h-3.5 ${m.error ? 'text-red-400' : 'text-teal-400'}`} />}
      </div>
      <div className="max-w-[80%] space-y-1.5">
        <div
          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : m.error
                ? 'bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-sm'
                : 'bg-dark-700/80 text-slate-100 rounded-tl-sm'
          }`}
        >
          {m.content}
        </div>
        {m.built && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Added "{m.built.name}" ({m.built.nodeCount} nodes) to the canvas
          </div>
        )}
        {canSave && (
          <button
            onClick={() => onSaveExample(m.id)}
            disabled={isSaving || isSaved}
            title="Save this conversation & workflow to training/custom_copilot_examples.jsonl"
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
              isSaved
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-dark-600 bg-dark-800/70 text-slate-400 hover:text-teal-300 hover:border-teal-500/40'
            }`}
          >
            {isSaved ? <Check className="w-2.5 h-2.5" /> : <BookmarkPlus className="w-2.5 h-2.5" />}
            {isSaved ? 'Saved for training' : isSaving ? 'Saving…' : 'Save to train'}
          </button>
        )}
      </div>
    </div>
  );
}

export function CopilotChatPanel() {
  const {
    isOpen,
    close,
    messages,
    isSending,
    isCheckingStatus,
    status,
    savingMsgId,
    savedMsgIds,
    totalSavedExamples,
    sendMessage,
    resetChat,
    recheckConnection,
    saveExampleForMessage
  } = useCopilotStore();
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSending]);

  // Automatically poll every 5s only while the panel is open and Qwen isn't ready yet.
  useEffect(() => {
    if (!isOpen || (status?.online && status?.modelInstalled)) return undefined;
    const timer = setInterval(() => {
      recheckConnection();
    }, 5000);
    return () => clearInterval(timer);
  }, [isOpen, status?.online, status?.modelInstalled, recheckConnection]);

  if (!isOpen) return null;

  const submit = (text) => {
    if (!text.trim() || isSending) return;
    sendMessage(text);
    setInput('');
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 max-w-full bg-dark-850/95 border-l border-dark-700 backdrop-blur-xl z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="h-12 px-4 border-b border-dark-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20">
            <Bot className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Qwen Copilot</div>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={recheckConnection}
            disabled={isCheckingStatus}
            title="Refresh Qwen connection"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={resetChat} title="New chat" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={close} title="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SetupHint status={status} onRetry={recheckConnection} isChecking={isCheckingStatus} />

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <Message
            key={m.id}
            m={m}
            isSaving={savingMsgId === m.id}
            isSaved={Boolean(savedMsgIds[m.id])}
            onSaveExample={saveExampleForMessage}
          />
        ))}
        {totalSavedExamples !== null && (
          <div className="text-[10px] text-center text-teal-400/80 font-mono">
            {totalSavedExamples} custom Copilot example{totalSavedExamples === 1 ? '' : 's'} queued for training
          </div>
        )}

        {messages.length === 1 && !isSending && (
          <div className="pt-1 space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="w-full text-left text-[11px] text-slate-300 px-3 py-2 rounded-xl bg-dark-800/80 border border-dark-700 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-[11px] text-teal-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Qwen is thinking… local models can take 10–60s
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-700 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isSending}
            placeholder="Describe your workflow… (Enter to send)"
            className="flex-1 resize-none bg-dark-900 border border-dark-600 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || isSending}
            className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-40 transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

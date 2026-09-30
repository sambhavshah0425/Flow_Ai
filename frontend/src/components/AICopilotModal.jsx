import React, { useState } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useExecutionStore } from '../store/useExecutionStore';
import {
  Sparkles,
  Zap,
  Play,
  X,
  Loader2,
  Cpu,
  FileText,
  Mail,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const PRESETS = [
  {
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    title: 'API Summarizer',
    prompt: 'Fetch latest posts from https://jsonplaceholder.typicode.com/posts/1, summarize key points with Gemini AI, and save the result as a text file.'
  },
  {
    icon: <FileText className="w-4 h-4 text-brand-400" />,
    title: 'Document Vector RAG',
    prompt: 'Ingest PDF document, generate vector embeddings, retrieve relevant chunks for questions, and synthesize answers with Gemini AI.'
  },
  {
    icon: <Mail className="w-4 h-4 text-emerald-400" />,
    title: 'Conditional Alert Pipeline',
    prompt: 'Check API response status from health endpoint. If status equals 200, send confirmation email alert, otherwise wait 5 seconds and retry.'
  },
  {
    icon: <Cpu className="w-4 h-4 text-purple-400" />,
    title: 'Autonomous AI Writer',
    prompt: 'Synthesize a comprehensive technical report on next-generation agentic workflows using Gemini AI and download the formatted analysis.'
  }
];

export function AICopilotModal({ isOpen, onClose, onWorkflowReady }) {
  const [prompt, setPrompt] = useState('');
  const { generateWorkflowFromPrompt, isGeneratingWorkflow, generationError } = useWorkflowStore();
  const { runCurrentWorkflow } = useExecutionStore();

  if (!isOpen) return null;

  const handleGenerate = async (autoRun = false) => {
    if (!prompt.trim() || isGeneratingWorkflow) return;

    const result = await generateWorkflowFromPrompt(prompt, autoRun);
    if (result.success) {
      if (autoRun) {
        // Auto-Run execution immediately
        await runCurrentWorkflow({
          name: result.workflow.name,
          nodes: result.workflow.nodes,
          edges: result.workflow.edges
        });
      }
      if (onWorkflowReady) {
        onWorkflowReady(result.workflow, autoRun);
      }
      onClose();
    }
  };

  const handleSelectPreset = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-dark-900/95 border border-brand-500/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-brand-950/80 text-white space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Background Blur Accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  FlowForge AI Copilot
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                  1-Click Autonomous
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Describe your objective in natural language. We'll assemble the DAG and wire all node parameters automatically.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input Area */}
        <div className="space-y-2 relative z-10">
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Fetch user data from an API, summarize their interests with Gemini AI, and if positive, send an email report, else download as file..."
              className="w-full bg-dark-800/80 border border-dark-600/80 focus:border-brand-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none transition-all"
              disabled={isGeneratingWorkflow}
            />
          </div>

          {generationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-semibold">Error:</span> {generationError}
            </div>
          )}
        </div>

        {/* Quick-Start Presets */}
        <div className="space-y-2 relative z-10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            Quick-Start Templates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset.prompt)}
                className="text-left p-3 rounded-xl bg-dark-800/60 hover:bg-dark-700/80 border border-dark-700/60 hover:border-brand-500/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {preset.icon}
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">
                    {preset.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Security & Free-tier Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-dark-800/40 p-2.5 rounded-xl border border-dark-700/40">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>100% Free & Safe:</strong> Includes built-in SSRF protection, DAG cycle validation, and automatic free-tier fallback.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-dark-800 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition-colors"
            disabled={isGeneratingWorkflow}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={!prompt.trim() || isGeneratingWorkflow}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-slate-100 hover:text-white border border-dark-600 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isGeneratingWorkflow ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-400" />
            )}
            Generate Workflow
          </button>

          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={!prompt.trim() || isGeneratingWorkflow}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isGeneratingWorkflow ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            ⚡ Generate & Auto-Run
          </button>
        </div>
      </div>
    </div>
  );
}

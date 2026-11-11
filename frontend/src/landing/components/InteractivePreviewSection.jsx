import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  Cpu,
  Database,
  EnvelopeSimple,
  FilePdf,
  GitBranch,
  Globe,
  MagnifyingGlass,
  Play,
  Robot,
  Sparkle,
  TextT,
  WarningCircle
} from '@phosphor-icons/react';
import { RevealBlock } from './MotionPrimitives';

const PRESETS = [
  {
    id: 'rag',
    label: 'PDF RAG Q&A',
    prompt: 'Index an uploaded PDF document and answer my question locally',
    workflowName: 'Document Q&A',
    nodes: [
      { id: 'pdf_1', type: 'pdf', label: 'Contract PDF', icon: FilePdf, output: '{{pdf_1.text}}', ms: '240ms' },
      { id: 'embed_1', type: 'embed', label: 'Index chunks', icon: Database, output: '48 vectors stored', ms: '318ms' },
      { id: 'retrieve_1', type: 'retrieve', label: 'Top 4 context', icon: MagnifyingGlass, output: '{{retrieve_1.context}}', ms: '84ms' },
      { id: 'ollama_1', type: 'ollama', label: 'Qwen answer', icon: Cpu, output: '{{ollama_1.text}}', ms: '1.84s' }
    ],
    finalOutput: 'Answered from 4 retrieved sections in 2.48s using local qwen3:1.7b.'
  },
  {
    id: 'branch',
    label: 'API health router',
    prompt: 'Check endpoint status; if 200 write a status note, else write an alert',
    workflowName: 'Health Check Router',
    nodes: [
      { id: 'api_1', type: 'api', label: 'GET health check', icon: Globe, output: '{{api_1.status}} = 200', ms: '194ms' },
      { id: 'condition_1', type: 'condition', label: 'Status equals 200', icon: GitBranch, output: 'branch: true', ms: '12ms' },
      { id: 'ollama_1', type: 'ollama', label: 'Write status note', icon: Cpu, output: '{{ollama_1.text}}', ms: '1.42s' },
      { id: 'ollama_2', type: 'ollama', label: 'Fallback alert', icon: Cpu, output: 'skipped branch', ms: '0ms', skipped: true }
    ],
    finalOutput: 'Routed true handle to ollama_1; false branch skipped cleanly by engine.'
  },
  {
    id: 'digest',
    label: 'PDF email digest',
    prompt: 'Summarize a PDF report in 5 bullets and email it via SMTP vault',
    workflowName: 'PDF Summary Email',
    nodes: [
      { id: 'pdf_1', type: 'pdf', label: 'Quarterly PDF', icon: FilePdf, output: '{{pdf_1.text}}', ms: '215ms' },
      { id: 'text_1', type: 'text', label: 'Summary prompt', icon: TextT, output: '{{text_1.text}}', ms: '8ms' },
      { id: 'ollama_1', type: 'ollama', label: 'Qwen summarizer', icon: Cpu, output: '{{ollama_1.text}}', ms: '2.14s' },
      { id: 'email_1', type: 'email', label: 'Send SMTP mail', icon: EnvelopeSimple, output: '{{secrets.SMTP_PASS}}', ms: '430ms' }
    ],
    finalOutput: 'Summary generated locally and delivered using AES 256 GCM vaulted SMTP credentials.'
  }
];

export function InteractivePreviewSection() {
  const [selectedId, setSelectedId] = useState('rag');
  const [promptInput, setPromptInput] = useState(PRESETS[0].prompt);
  const [promptError, setPromptError] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'running' | 'completed'
  const [completedCount, setCompletedCount] = useState(0);
  const timersRef = useRef([]);

  const activePreset = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  const clearTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const handleSelectPreset = (preset) => {
    clearTimers();
    setSelectedId(preset.id);
    setPromptInput(preset.prompt);
    setPromptError('');
    setStatus('idle');
    setCompletedCount(0);
  };

  const handleGenerateAndRun = (e) => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed) {
      setPromptError('Enter a workflow objective before running the preview.');
      return;
    }

    setPromptError('');
    clearTimers();

    // Match prompt intent to closest preset for realistic preview
    const lower = trimmed.toLowerCase();
    let targetId = selectedId;
    if (lower.includes('email') || lower.includes('mail') || lower.includes('smtp')) {
      targetId = 'digest';
    } else if (lower.includes('api') || lower.includes('200') || lower.includes('condition') || lower.includes('alert')) {
      targetId = 'branch';
    } else if (lower.includes('pdf') || lower.includes('rag') || lower.includes('question')) {
      targetId = 'rag';
    }
    setSelectedId(targetId);

    setStatus('loading');
    setCompletedCount(0);

    const t0 = setTimeout(() => {
      setStatus('running');
    }, 550);

    const stepDelays = [900, 1250, 1600, 2000];
    stepDelays.forEach((ms, idx) => {
      const t = setTimeout(() => {
        setCompletedCount(idx + 1);
        if (idx === stepDelays.length - 1) {
          setStatus('completed');
        }
      }, ms);
      timersRef.current.push(t);
    });
    timersRef.current.push(t0);
  };

  const handleReset = () => {
    clearTimers();
    setStatus('idle');
    setCompletedCount(0);
    setPromptError('');
  };

  return (
    <section
      id="preview"
      aria-labelledby="preview-heading"
      className="bg-[#000000] py-20 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <RevealBlock className="space-y-4 max-w-[680px]">
          <p className="caption-3 text-[#9B9B9B] uppercase tracking-wider">Interactive studio preview</p>
          <h2 id="preview-heading" className="heading-2 text-white">
            Test how Qwen wires and executes a graph
          </h2>
          <p className="body-3 text-[#9B9B9B]">
            Pick a real FlowForge pipeline or edit the prompt below to preview DAG validation, variable binding, and step execution before opening the studio.
          </p>
        </RevealBlock>

        <RevealBlock delay={0.08}>
          <div className="bg-[#181818] border border-[#272727] rounded-3xl p-4 sm:p-8 space-y-6">
            {/* Preset Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Workflow presets">
                {PRESETS.map((preset) => {
                  const isActive = preset.id === selectedId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleSelectPreset(preset)}
                      className={`py-2 px-3 rounded-lg button-sm lp-interactive border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        isActive
                          ? 'bg-[#272727] border-[#313131] text-white'
                          : 'bg-[#000000] border-[#272727] text-[#9B9B9B] hover:text-white hover:bg-[#1F1F1F]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#000000] border border-[#272727] text-[#9B9B9B] hover:text-white hover:bg-[#1F1F1F] button-xsm lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ArrowCounterClockwise size={14} weight="regular" aria-hidden="true" />
                <span>Reset preview</span>
              </button>
            </div>

            {/* Prompt Bar */}
            <form onSubmit={handleGenerateAndRun} noValidate className="space-y-2">
              <label htmlFor="preview-prompt-input" className="caption-4 text-[#9B9B9B] flex items-center gap-2">
                <Robot size={14} weight="regular" aria-hidden="true" />
                <span>Chat with Qwen prompt</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="preview-prompt-input"
                  type="text"
                  value={promptInput}
                  onChange={(e) => {
                    setPromptInput(e.target.value);
                    if (promptError) setPromptError('');
                  }}
                  placeholder="Describe what nodes should run, for example: summarize a PDF and email it"
                  aria-invalid={Boolean(promptError)}
                  aria-describedby={promptError ? 'preview-prompt-error' : undefined}
                  className="flex-1 bg-[#000000] border border-[#272727] focus:border-white rounded-lg px-3 py-2 body-6 text-white placeholder-[#737373] focus:outline-none transition-colors duration-300"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'running'}
                  className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-black hover:bg-[#E5E5E5] disabled:opacity-60 button-md lp-interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shrink-0"
                >
                  {status === 'loading' || status === 'running' ? (
                    <>
                      <Sparkle size={16} weight="fill" aria-hidden="true" />
                      <span>{status === 'loading' ? 'Parsing DAG' : 'Streaming run'}</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} weight="fill" aria-hidden="true" />
                      <span>Simulate run</span>
                    </>
                  )}
                </button>
              </div>
              {promptError && (
                <p id="preview-prompt-error" role="alert" className="caption-4 text-rose-400 flex items-center gap-2 pt-1">
                  <WarningCircle size={14} weight="fill" aria-hidden="true" />
                  <span>{promptError}</span>
                </p>
              )}
            </form>

            {/* Preview Canvas Body (with loading skeleton, empty/idle, and execution states) */}
            <div className="bg-[#000000] border border-[#272727] rounded-lg sm:rounded-2xl p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="title-4 text-white">{activePreset.workflowName}</span>
                <span className="caption-5 lp-mono text-[#9B9B9B]">
                  {status === 'idle' && 'Ready to run'}
                  {status === 'loading' && 'Checking topological order...'}
                  {status === 'running' && `Executed ${completedCount} of ${activePreset.nodes.length} nodes`}
                  {status === 'completed' && 'Execution finished'}
                </span>
              </div>

              {status === 'loading' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Loading workflow preview">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className="bg-[#181818] border border-[#272727] rounded-xl p-4 space-y-3 animate-pulse"
                    >
                      <div className="h-4 w-16 bg-[#272727] rounded" />
                      <div className="h-6 w-32 bg-[#272727] rounded" />
                      <div className="h-8 w-full bg-[#1F1F1F] rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activePreset.nodes.map((node, index) => {
                    const Icon = node.icon;
                    const isDone =
                      status === 'completed' || (status === 'running' && index < completedCount);
                    const isRunning = status === 'running' && index === completedCount;

                    return (
                      <div
                        key={node.id}
                        className={`rounded-xl p-4 border lp-interactive space-y-3 ${
                          isRunning
                            ? 'bg-[#1F1F1F] border-white'
                            : isDone
                              ? 'bg-[#181818] border-[#313131]'
                              : 'bg-[#181818] border-[#272727]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="caption-5 lp-mono text-[#9B9B9B]">{node.id}</span>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 caption-5 lp-mono text-emerald-400">
                              <CheckCircle size={12} weight="fill" aria-hidden="true" />
                              {node.skipped ? 'skipped' : node.ms}
                            </span>
                          ) : isRunning ? (
                            <span className="caption-5 lp-mono text-white">running</span>
                          ) : (
                            <span className="caption-5 lp-mono text-[#737373]">queued</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#272727] text-white flex items-center justify-center shrink-0">
                            <Icon size={16} weight="regular" aria-hidden="true" />
                          </span>
                          <span className="title-4 text-white">{node.label}</span>
                        </div>

                        <div className="bg-[#000000] border border-[#272727] rounded-lg px-2 py-1 caption-5 lp-mono text-[#9B9B9B] truncate">
                          {node.output}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Execution Output Console Bar */}
              <div className="bg-[#181818] border border-[#272727] rounded-xl p-4">
                {status === 'idle' && (
                  <p className="caption-2 text-[#9B9B9B]">
                    Select a preset above or type your own goal, then click Simulate run to watch each node execute.
                  </p>
                )}
                {status === 'loading' && (
                  <p className="caption-2 lp-mono text-[#9B9B9B]">
                    Validating edges with parseDAG and resolving runtime variables...
                  </p>
                )}
                {status === 'running' && (
                  <p className="caption-2 lp-mono text-white">
                    Socket.IO room active: processing node {Math.min(completedCount + 1, activePreset.nodes.length)} of {activePreset.nodes.length}...
                  </p>
                )}
                {status === 'completed' && (
                  <p className="caption-1 text-white flex items-center gap-2">
                    <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{activePreset.finalOutput}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useExecutionStore } from '../store/useExecutionStore';
import { Terminal, Activity, CheckCircle, AlertTriangle, ChevronUp, ChevronDown, Clock, Zap, Code2, Download } from 'lucide-react';

// Saves content to the user's disk via a temporary object URL. Using a Blob
// (rather than the node's data: URL) is more reliable for large content and is
// triggered by a real click, so browsers won't block it.
function triggerDownload(fileName, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content ?? ''], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'output.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Strip Markdown markers to clean, readable plain text (for .txt downloads)
function markdownToPlainText(md) {
  return String(md)
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')                 // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')             // bold
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+?)`/g, '$1')                // inline code
    .replace(/^\s*[-*+]\s+/gm, '• ')             // bullets
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')         // ordered items
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')   // links
    .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, '$1$2') // italic *x*
    .replace(/(^|[^_])_(?!_)(.+?)_(?!_)/g, '$1$2')     // italic _x_
    .trim();
}

// Inline Markdown -> HTML (bold, italic, code, links)
function inlineMd(s) {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
  out = out.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return out;
}

// Block-level Markdown -> HTML (headings, bullet/ordered lists, paragraphs)
function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { closeList(); continue; }

    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      closeList();
      const lvl = m[1].length;
      html += `<h${lvl}>${inlineMd(m[2])}</h${lvl}>`;
    } else if ((m = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/))) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inlineMd(m[1])}</li>`;
    } else {
      closeList();
      html += `<p>${inlineMd(line)}</p>`;
    }
  }
  closeList();
  return html;
}

function buildHtmlDoc(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 760px; margin: 48px auto; padding: 0 24px; line-height: 1.65; color: #1a1a1a; }
  h1,h2,h3,h4 { line-height: 1.25; margin: 1.4em 0 0.5em; }
  h1 { font-size: 1.8em; } h2 { font-size: 1.4em; } h3 { font-size: 1.15em; }
  ul { padding-left: 1.4em; } li { margin: 0.25em 0; }
  code { background: #f2f2f2; padding: 1px 6px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.9em; }
  a { color: #2563eb; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #e2e8f0; } code { background: #1e293b; } a { color: #60a5fa; }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// Picks the single best human-readable string out of an output payload
// (most node outputs have a `text` field; download nodes have `content`; fall back to raw value)
function getPreviewText(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  if (typeof value.text === 'string') return value.text;
  if (typeof value.content === 'string') return value.content;
  return JSON.stringify(value);
}

function OutputCard({ node, value }) {
  const [showRaw, setShowRaw] = useState(false);
  const preview = getPreviewText(value);
  const truncated = preview.length > 240 ? preview.slice(0, 240) + '…' : preview;

  // Download nodes carry a downloadUrl + content; show real save-to-disk buttons
  const isDownloadable =
    value && typeof value === 'object' && value.fileName && (value.content != null || value.downloadUrl);
  const downloadContent = isDownloadable ? (value.content ?? getPreviewText(value)) : '';
  const downloadBase = isDownloadable ? value.fileName.replace(/\.[^.]+$/, '') : 'output';

  return (
    <div className="bg-dark-900/80 p-3 rounded-lg border border-dark-800 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-brand-400 font-bold text-[11px] flex items-center gap-2">
          <span>{node?.label || node?.id}</span>
          {node?.type && (
            <span className="text-[9px] uppercase tracking-wide text-slate-500 bg-dark-800 px-1.5 py-0.5 rounded">
              {node.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDownloadable && (
            <>
              <button
                onClick={() => triggerDownload(`${downloadBase}.txt`, markdownToPlainText(downloadContent))}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300"
                title={`Download ${downloadBase}.txt (clean text)`}
              >
                <Download className="w-3 h-3" /> TXT
              </button>
              <button
                onClick={() =>
                  triggerDownload(
                    `${downloadBase}.html`,
                    buildHtmlDoc(downloadBase, markdownToHtml(downloadContent)),
                    'text/html;charset=utf-8'
                  )
                }
                className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300"
                title={`Download ${downloadBase}.html (formatted)`}
              >
                <Download className="w-3 h-3" /> HTML
              </button>
            </>
          )}
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
          >
            <Code2 className="w-3 h-3" /> {showRaw ? 'Hide raw data' : 'View raw data'}
          </button>
        </div>
      </div>

      <p className="text-slate-200 text-[12px] leading-relaxed whitespace-pre-wrap">
        {truncated || <span className="italic text-slate-500">(no text output)</span>}
      </p>

      {showRaw && (
        <pre className="text-emerald-300 text-[11px] whitespace-pre-wrap overflow-x-auto bg-dark-950 p-2 rounded">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
        </pre>
      )}
    </div>
  );
}

export function ExecutionConsole({ nodes = [] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'outputs' | 'metrics'

  const { logs, metrics, nodeOutputs, isExecuting } = useExecutionStore();

  // Only show one card per REAL node (matched by actual node.id), skipping the
  // label/type alias keys the backend also stores for {{...}} template lookups.
  const realNodeIds = new Set(nodes.map((n) => n.id));
  const dedupedOutputs = Object.entries(nodeOutputs).filter(([key]) => realNodeIds.has(key));
  const nodesById = Object.fromEntries(nodes.map((n) => [n.id, { id: n.id, label: n.data?.label, type: n.type }]));

  return (
    <div className="bg-dark-950/95 border-t border-dark-700/80 backdrop-blur-xl transition-all duration-300 z-30">
      {/* Header Bar */}
      <div className="h-10 px-4 bg-dark-900/80 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white"
          >
            <Terminal className="w-4 h-4 text-brand-400" />
            Execution Console
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Status Pills */}
          {isExecuting && (
            <span className="flex items-center gap-1.5 text-[11px] text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" /> Executing DAG Pipeline...
            </span>
          )}

          {metrics && !isExecuting && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> Execution Complete ({metrics.totalDurationMs}ms)
            </span>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setIsOpen(true); setActiveTab('logs'); }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'logs' ? 'bg-dark-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs ({logs.length})
          </button>
          <button
            onClick={() => { setIsOpen(true); setActiveTab('outputs'); }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'outputs' ? 'bg-dark-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Outputs ({dedupedOutputs.length})
          </button>
          <button
            onClick={() => { setIsOpen(true); setActiveTab('metrics'); }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'metrics' ? 'bg-dark-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Observability Metrics
          </button>
        </div>
      </div>

      {/* Console Drawer Content */}
      {isOpen && (
        <div className="h-48 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1">
          {activeTab === 'logs' && (
            <div>
              {logs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">No execution logs yet. Click "Run Workflow" above to execute.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-1 border-b border-dark-800/60 font-mono text-[11px]">
                    <span className="text-slate-500 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`uppercase font-bold text-[10px] px-1 rounded ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-500/20 text-brand-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-400">[{log.nodeId}]</span>
                    <span className="text-slate-200 flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'outputs' && (
            <div className="space-y-3">
              {dedupedOutputs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">No node outputs captured yet.</div>
              ) : (
                dedupedOutputs.map(([key, value]) => (
                  <OutputCard key={key} node={nodesById[key] || { id: key }} value={value} />
                ))
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
              <div className="bg-dark-900 p-3 rounded-xl border border-dark-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Total Duration</div>
                <div className="text-base font-bold text-white mt-1">{metrics?.totalDurationMs || 0} ms</div>
              </div>
              <div className="bg-dark-900 p-3 rounded-xl border border-dark-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Tokens Used</div>
                <div className="text-base font-bold text-purple-400 mt-1">{metrics?.tokensUsed || 0} Tokens</div>
              </div>
              <div className="bg-dark-900 p-3 rounded-xl border border-dark-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Nodes Executed</div>
                <div className="text-base font-bold text-emerald-400 mt-1">{metrics?.nodesExecuted || 0} Nodes</div>
              </div>
              <div className="bg-dark-900 p-3 rounded-xl border border-dark-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Retries Triggered</div>
                <div className="text-base font-bold text-amber-400 mt-1">{metrics?.retryCount || 0}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
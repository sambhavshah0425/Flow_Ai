import React, { useState } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { api } from '../services/api';
import { Settings, Trash2, HelpCircle, RefreshCw, Layers, Upload, FileText } from 'lucide-react';

const MAX_PDF_MB = 8;

export function NodeInspector() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode } = useWorkflowStore();

  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-72 bg-dark-800/90 border-l border-dark-700/80 p-5 backdrop-blur-md flex flex-col items-center justify-center text-center text-slate-500">
        <Settings className="w-8 h-8 mb-2 stroke-1 opacity-50" />
        <p className="text-xs">Select a node on the canvas to inspect & configure properties.</p>
      </div>
    );
  }

  const { id, type, data } = selectedNode;

  const handleChange = (key, val) => {
    updateNodeData(id, { [key]: val });
  };

  const handlePdfFile = async (file) => {
    if (!file) return;
    setPdfError('');

    if (file.type && file.type !== 'application/pdf') {
      setPdfError('Please choose a PDF file.');
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setPdfError(`File too large (max ${MAX_PDF_MB}MB).`);
      return;
    }

    setPdfUploading(true);
    try {
      // Read the file as a data URL, then let the backend extract real text
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });

      const res = await api.post('/upload/pdf', { fileName: file.name, dataBase64 });
      const { text, pageCount, charCount, fileName } = res.data;

      updateNodeData(id, {
        text,
        fileName,
        pageCount,
        extractedChars: charCount
      });
    } catch (err) {
      setPdfError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setPdfUploading(false);
    }
  };

  return (
    <div className="w-80 bg-dark-800/90 border-l border-dark-700/80 p-5 flex flex-col gap-5 backdrop-blur-md overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-700 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">Node Configuration</h3>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete Node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Basic Meta */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Node Identifier</label>
          <input
            type="text"
            value={id}
            disabled
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Display Title / Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
          />
        </div>
      </div>

      {/* Type Specific Fields */}
      <div className="space-y-4 pt-2 border-t border-dark-700/60">
        {type === 'text' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Text / Prompt Input</span>
              <span className="text-[10px] text-brand-400 font-mono">&#123;&#123;var&#125;&#125; supported</span>
            </label>
            <textarea
              rows={5}
              value={data.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              placeholder="Enter text or variables like {{pdf_1.text}}"
            />
          </div>
        )}

        {type === 'pdf' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Upload PDF File</label>
              <label
                className={`flex items-center justify-center gap-2 w-full bg-dark-900 border border-dashed rounded-lg px-2.5 py-3 text-xs transition-colors ${
                  pdfUploading
                    ? 'border-brand-500 text-brand-400 cursor-wait'
                    : 'border-dark-600 text-slate-300 hover:border-brand-500 hover:text-brand-400 cursor-pointer'
                }`}
              >
                {pdfUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {pdfUploading ? 'Extracting text…' : 'Choose a PDF to extract'}
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={pdfUploading}
                  onChange={(e) => { handlePdfFile(e.target.files?.[0]); e.target.value = ''; }}
                  className="hidden"
                />
              </label>
              {pdfError && <p className="text-[10px] text-red-400 mt-1">{pdfError}</p>}
            </div>

            {data.fileName && (
              <div className="bg-dark-900/60 border border-dark-700 rounded-lg px-2.5 py-2 space-y-0.5 text-[10px]">
                <div className="text-emerald-400 font-mono flex items-center gap-1.5 truncate">
                  <FileText className="w-3 h-3 shrink-0" /> {data.fileName}
                </div>
                <div className="text-slate-400">
                  {(data.pageCount || 0)} page{data.pageCount === 1 ? '' : 's'} ·{' '}
                  {(data.extractedChars ?? data.text?.length ?? 0).toLocaleString()} chars extracted
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Extracted Text (editable)</label>
              <textarea
                rows={5}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2 text-xs text-white font-mono"
                placeholder="Upload a PDF above, or paste/edit text manually…"
              />
            </div>
          </div>
        )}

        {type === 'gemini' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model Selection</label>
              <select
                value={data.model || 'gemini-flash-latest'}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="gemini-flash-latest">gemini-flash-latest (Recommended)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Balanced)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>AI Prompt Template</span>
                <span className="text-[10px] text-purple-400 font-mono">&#123;&#123;node.output&#125;&#125;</span>
              </label>
              <textarea
                rows={4}
                value={data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white font-mono focus:border-purple-500"
                placeholder="Summarize {{text_1.text}} into bullet points"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temperature ({data.temperature || 0.7})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature !== undefined ? data.temperature : 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {type === 'ollama' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Local Model (Ollama)</label>
              <select
                value={data.model || 'qwen3:1.7b'}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="qwen3:1.7b">qwen3:1.7b (Fast, recommended)</option>
                <option value="qwen3:4b">qwen3:4b (Better, slower)</option>
                <option value="qwen3:8b">qwen3:8b (Best, needs 16GB RAM)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Pull it once with <span className="font-mono text-teal-400">ollama pull {data.model || 'qwen3:1.7b'}</span>
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Prompt</span>
                <span className="text-[10px] text-teal-400 font-mono">&#123;&#123;node.output&#125;&#125;</span>
              </label>
              <textarea
                rows={4}
                value={data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                placeholder="Summarize {{text_1.text}} into bullet points"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temperature ({data.temperature ?? 0.7})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature !== undefined ? data.temperature : 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {type === 'api' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">HTTP Method</label>
              <select
                value={data.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Request Endpoint URL</label>
              <input
                type="text"
                value={data.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}

        {type === 'email' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">To</label>
              <input
                type="text"
                value={data.to || ''}
                onChange={(e) => handleChange('to', e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                value={data.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Body</span>
                <span className="text-[10px] text-sky-400 font-mono">&#123;&#123;var&#125;&#125; supported</span>
              </label>
              <textarea
                rows={4}
                value={data.body || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="{{gemini.text}}"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={data.isHtml === true}
                onChange={(e) => handleChange('isHtml', e.target.checked)}
                className="accent-sky-500"
              />
              Send body as HTML
            </label>

            <div className="pt-3 border-t border-dark-700/60 space-y-3">
              <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">SMTP connection</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Keep credentials in the <span className="text-brand-400">Secrets Vault</span> and reference them here (e.g.{' '}
                <span className="font-mono">&#123;&#123;secrets.SMTP_PASS&#125;&#125;</span>). For Gmail, use an{' '}
                <span className="text-slate-300">App Password</span>, host <span className="font-mono">smtp.gmail.com</span>, port <span className="font-mono">465</span>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">Host</label>
                  <input type="text" value={data.smtpHost || ''} onChange={(e) => handleChange('smtpHost', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Port</label>
                  <input type="number" value={data.smtpPort || 587} onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">User</label>
                  <input type="text" value={data.smtpUser || ''} onChange={(e) => handleChange('smtpUser', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">Password</label>
                  <input type="text" value={data.smtpPass || ''} onChange={(e) => handleChange('smtpPass', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono" />
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'embed' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Text to index</span>
                <span className="text-[10px] text-violet-400 font-mono">&#123;&#123;var&#125;&#125; supported</span>
              </label>
              <textarea
                rows={4}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="{{pdf.text}}"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Chunk size (chars)</label>
              <input
                type="number"
                min="100"
                value={data.chunkSize || 900}
                onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Splits the text into chunks and embeds each one (Gemini embeddings, or a free offline fallback). Wire a <span className="text-cyan-400">Retrieve</span> node after this to search them.
            </p>
          </div>
        )}

        {type === 'retrieve' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Query</span>
                <span className="text-[10px] text-cyan-400 font-mono">&#123;&#123;var&#125;&#125; supported</span>
              </label>
              <textarea
                rows={3}
                value={data.query || ''}
                onChange={(e) => handleChange('query', e.target.value)}
                placeholder="What are the payment terms?"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Top K chunks</label>
              <input
                type="number"
                min="1"
                max="20"
                value={data.topK || 4}
                onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Returns the most relevant chunks as <span className="font-mono text-cyan-400">&#123;&#123;retrieve.context&#125;&#125;</span> — feed that into a Gemini node’s prompt to answer from your document.
            </p>
          </div>
        )}

        {type === 'condition' && (() => {
          const UNARY = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];
          const op = data.operator || 'contains';
          const showRight = !UNARY.includes(op);
          return (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Left value</span>
                  <span className="text-[10px] text-brand-400 font-mono">&#123;&#123;var&#125;&#125; supported</span>
                </label>
                <input
                  type="text"
                  value={data.leftValue || ''}
                  onChange={(e) => handleChange('leftValue', e.target.value)}
                  placeholder="{{gemini_1.text}}"
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Operator</label>
                <select
                  value={op}
                  onChange={(e) => handleChange('operator', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="not_contains">not contains</option>
                  <option value="starts_with">starts with</option>
                  <option value="ends_with">ends with</option>
                  <option value="gt">greater than (&gt;)</option>
                  <option value="gte">greater or equal (&ge;)</option>
                  <option value="lt">less than (&lt;)</option>
                  <option value="lte">less or equal (&le;)</option>
                  <option value="regex">matches regex</option>
                  <option value="is_empty">is empty</option>
                  <option value="is_not_empty">is not empty</option>
                  <option value="is_true">is true</option>
                  <option value="is_false">is false</option>
                </select>
              </div>
              {showRight && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Right value</label>
                  <input
                    type="text"
                    value={data.rightValue || ''}
                    onChange={(e) => handleChange('rightValue', e.target.value)}
                    placeholder="yes"
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                On <span className="text-emerald-400 font-medium">True</span> the green branch runs; on{' '}
                <span className="text-rose-400 font-medium">False</span> the red branch runs. The other branch is skipped.
              </p>
            </div>
          );
        })()}

        {type === 'delay' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Delay Duration (milliseconds)</label>
            <input
              type="number"
              value={data.delayMs || 1000}
              onChange={(e) => handleChange('delayMs', parseInt(e.target.value))}
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
        )}

        {type === 'download' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Download File Name</label>
              <input
                type="text"
                value={data.fileName || 'output.txt'}
                onChange={(e) => handleChange('fileName', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Content Input Template</label>
              <textarea
                rows={3}
                value={data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Retry Policy Configuration */}
      <div className="pt-3 border-t border-dark-700/60 space-y-3">
        <h4 className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5" /> Exponential Retry Backoff
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Max Retries</label>
            <input
              type="number"
              min="1"
              max="5"
              value={data.maxRetries || 1}
              onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Delay (ms)</label>
            <input
              type="number"
              value={data.retryDelayMs || 1000}
              onChange={(e) => handleChange('retryDelayMs', parseInt(e.target.value))}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { Type, FileText, Globe, Clock, Download, GitBranch, Database, Search, Mail, Plus, Bot } from 'lucide-react';

const NODE_PALETTE = [
  { type: 'text', label: 'Text Input', icon: Type, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Raw text or prompt variable' },
  { type: 'pdf', label: 'PDF Reader', icon: FileText, color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Extract text from PDF file' },
  { type: 'ollama', label: 'Local AI (Qwen)', icon: Bot, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', desc: 'Free local AI via Ollama' },
  { type: 'embed', label: 'Embed & Index', icon: Database, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', desc: 'Chunk & embed text for RAG' },
  { type: 'retrieve', label: 'Retrieve', icon: Search, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', desc: 'Semantic search over indexed text' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Branch on a true/false test' },
  { type: 'api', label: 'REST API', icon: Globe, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'HTTP GET/POST client' },
  { type: 'delay', label: 'Delay Timer', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Async execution pause' },
  { type: 'download', label: 'Download File', icon: Download, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', desc: 'Export output result file' },
  { type: 'email', label: 'Send Email', icon: Mail, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', desc: 'Send an email via SMTP' }
];

export function NodeSidebar() {
  const addNode = useWorkflowStore((s) => s.addNode);

  return (
    <div className="w-64 bg-dark-800/90 border-r border-dark-700/80 p-4 flex flex-col gap-4 backdrop-blur-md">
      <div>
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Node Palette</h3>
        <p className="text-[11px] text-slate-400">Click a node to add it to canvas</p>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {NODE_PALETTE.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              onClick={() => addNode(item.type)}
              className="glass-card p-3 rounded-xl border cursor-pointer hover:border-brand-500/40 hover:scale-[1.02] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

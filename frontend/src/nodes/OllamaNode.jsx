import React from 'react';
import { BaseNode } from './BaseNode';
import { Bot } from 'lucide-react';

export function OllamaNode(props) {
  const prompt = props.data?.prompt || 'Ask the local AI...';
  const saved = props.data?.model;
  const model = saved && !/^gemini/i.test(saved) ? saved : 'qwen3:1.7b';

  return (
    <BaseNode id={props.id} data={props.data} icon={Bot} title="Local AI (Qwen)" colorClass="bg-teal-500/20 text-teal-400">
      <div className="space-y-1">
        <div className="text-[10px] text-teal-400 font-mono flex items-center justify-between">
          <span>Model: {model}</span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500">local · free</span>
        </div>
        <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
          {prompt}
        </div>
      </div>
    </BaseNode>
  );
}

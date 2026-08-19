import React from 'react';
import { BaseNode } from './BaseNode';
import { Sparkles } from 'lucide-react';

export function GeminiNode(props) {
  const prompt = props.data?.prompt || 'Summarize data...';
  const model = props.data?.model || 'gemini-3.1-flash-lite';

  return (
    <BaseNode id={props.id} data={props.data} icon={Sparkles} title="Gemini AI" colorClass="bg-purple-500/20 text-purple-400">
      <div className="space-y-1">
        <div className="text-[10px] text-purple-400 font-mono flex items-center justify-between">
          <span>Model: {model}</span>
        </div>
        <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
          {prompt}
        </div>
      </div>
    </BaseNode>
  );
}
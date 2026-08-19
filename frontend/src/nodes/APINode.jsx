import React from 'react';
import { BaseNode } from './BaseNode';
import { Globe } from 'lucide-react';

export function APINode(props) {
  const method = props.data?.method || 'GET';
  const url = props.data?.url || 'https://api.example.com';

  return (
    <BaseNode id={props.id} data={props.data} icon={Globe} title="REST API" colorClass="bg-emerald-500/20 text-emerald-400">
      <div className="flex items-center gap-1.5 font-mono text-[11px] bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{method}</span>
        <span className="truncate text-slate-300">{url}</span>
      </div>
    </BaseNode>
  );
}

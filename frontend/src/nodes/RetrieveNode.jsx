import React from 'react';
import { BaseNode } from './BaseNode';
import { Search } from 'lucide-react';

export function RetrieveNode(props) {
  const query = props.data?.query || 'What is this about?';
  const topK = props.data?.topK || 4;
  return (
    <BaseNode id={props.id} data={props.data} icon={Search} title="Retrieve" colorClass="bg-cyan-500/20 text-cyan-400">
      <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 line-clamp-2 leading-snug">
        {query}
      </div>
      <div className="text-[10px] text-slate-500 pt-1">top {topK} relevant chunks → {'{{retrieve.context}}'}</div>
    </BaseNode>
  );
}

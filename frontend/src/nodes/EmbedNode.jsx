import React from 'react';
import { BaseNode } from './BaseNode';
import { Database } from 'lucide-react';

export function EmbedNode(props) {
  const text = props.data?.text || '{{pdf.text}}';
  return (
    <BaseNode id={props.id} data={props.data} icon={Database} title="Embed & Index" colorClass="bg-violet-500/20 text-violet-400">
      <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
        index: {text}
      </div>
      <div className="text-[10px] text-slate-500 pt-1">Chunks &amp; embeds text for retrieval</div>
    </BaseNode>
  );
}

import React from 'react';
import { BaseNode } from './BaseNode';
import { Type } from 'lucide-react';

export function TextNode(props) {
  const text = props.data?.text || '';

  return (
    <BaseNode id={props.id} data={props.data} icon={Type} title="Text Input" colorClass="bg-blue-500/20 text-blue-400">
      <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
        {text || 'No text provided'}
      </div>
    </BaseNode>
  );
}

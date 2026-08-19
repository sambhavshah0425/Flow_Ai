import React from 'react';
import { BaseNode } from './BaseNode';
import { Clock } from 'lucide-react';

export function DelayNode(props) {
  const delayMs = props.data?.delayMs || 1000;

  return (
    <BaseNode id={props.id} data={props.data} icon={Clock} title="Delay Timer" colorClass="bg-amber-500/20 text-amber-400">
      <div className="font-mono text-[11px] text-amber-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 text-center">
        ⏱ Delay {delayMs}ms
      </div>
    </BaseNode>
  );
}

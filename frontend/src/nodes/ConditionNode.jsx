import React from 'react';
import { BaseNode } from './BaseNode';
import { GitBranch } from 'lucide-react';

const OP_LABEL = {
  equals: '==', not_equals: '!=', contains: 'contains', not_contains: 'not contains',
  starts_with: 'starts with', ends_with: 'ends with',
  gt: '>', gte: '>=', lt: '<', lte: '<=',
  is_empty: 'is empty', is_not_empty: 'is not empty',
  is_true: 'is true', is_false: 'is false', regex: 'matches'
};

const UNARY = new Set(['is_empty', 'is_not_empty', 'is_true', 'is_false']);

export function ConditionNode(props) {
  const d = props.data || {};
  const op = d.operator || 'contains';
  const left = d.leftValue || '{{...}}';
  const right = UNARY.has(op) ? '' : (d.rightValue ?? '');

  return (
    <BaseNode
      id={props.id}
      data={props.data}
      icon={GitBranch}
      title="Condition"
      colorClass="bg-amber-500/20 text-amber-400"
      sourceHandles={[
        { id: 'true', top: '62%', colorClass: '!bg-emerald-500' },
        { id: 'false', top: '82%', colorClass: '!bg-rose-500' }
      ]}
    >
      <div className="font-mono text-[10.5px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 break-words leading-snug">
        <span className="text-brand-400">{left}</span>{' '}
        <span className="text-amber-400">{OP_LABEL[op] || op}</span>
        {right !== '' && <> <span className="text-emerald-300">{String(right)}</span></>}
      </div>
      <div className="flex flex-col gap-1 pt-1 text-[10px] font-medium">
        <div className="flex items-center justify-end gap-1.5 text-emerald-400">
          True <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-center justify-end gap-1.5 text-rose-400">
          False <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
      </div>
    </BaseNode>
  );
}

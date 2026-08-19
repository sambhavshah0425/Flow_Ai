import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useExecutionStore } from '../store/useExecutionStore';
import { CheckCircle2, AlertTriangle, Loader2, MinusCircle } from 'lucide-react';

/**
 * Shared node shell: status-driven border/badge + input handle + output handle(s).
 * Pass `sourceHandles` (array of { id, top, colorClass }) to render multiple
 * labeled outputs (e.g. the Condition node's true/false) instead of one.
 */
export function BaseNode({ id, data, icon: Icon, title, colorClass, children, sourceHandles }) {
  const nodeStates = useExecutionStore((s) => s.nodeStates);
  const status = nodeStates[id] || 'idle';

  let statusBorder = 'border-dark-700 hover:border-brand-500/50';
  let badge = null;
  let dimmed = false;

  if (status === 'running') {
    statusBorder = 'border-brand-500 ring-2 ring-brand-500/30 animate-pulse';
    badge = (
      <span className="flex items-center gap-1 text-[10px] text-brand-400 font-medium bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
        <Loader2 className="w-3 h-3 animate-spin" /> Running
      </span>
    );
  } else if (status === 'completed') {
    statusBorder = 'border-emerald-500/80 ring-2 ring-emerald-500/20';
    badge = (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> Done
      </span>
    );
  } else if (status === 'failed') {
    statusBorder = 'border-red-500 ring-2 ring-red-500/30';
    badge = (
      <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
        <AlertTriangle className="w-3 h-3" /> Error
      </span>
    );
  } else if (status === 'skipped') {
    statusBorder = 'border-dark-700 border-dashed';
    dimmed = true;
    badge = (
      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/10">
        <MinusCircle className="w-3 h-3" /> Skipped
      </span>
    );
  }

  return (
    <div className={`bg-dark-800/95 border ${statusBorder} rounded-xl shadow-xl w-64 text-slate-100 overflow-hidden backdrop-blur-md transition-all ${dimmed ? 'opacity-45' : ''}`}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-brand-500 !border-2 !border-dark-900" />

      {/* Header */}
      <div className="px-3.5 py-2.5 bg-dark-900/60 border-b border-dark-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClass}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="font-semibold text-xs text-white truncate max-w-[120px]">
            {data.label || title}
          </div>
        </div>
        {badge}
      </div>

      {/* Body */}
      <div className="p-3 text-xs text-slate-300 space-y-1">
        {children}
      </div>

      {/* Output Handle(s) */}
      {sourceHandles && sourceHandles.length > 0 ? (
        sourceHandles.map((h) => (
          <Handle
            key={h.id}
            id={h.id}
            type="source"
            position={Position.Right}
            style={{ top: h.top }}
            className={`!w-3 !h-3 !border-2 !border-dark-900 ${h.colorClass}`}
          />
        ))
      ) : (
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-brand-500 !border-2 !border-dark-900" />
      )}
    </div>
  );
}

import React from 'react';
import { BaseNode } from './BaseNode';
import { FileText } from 'lucide-react';

export function PDFNode(props) {
  const fileName = props.data?.fileName || 'document.pdf';
  const pageCount = props.data?.pageCount;
  const text = props.data?.text || '';

  return (
    <BaseNode id={props.id} data={props.data} icon={FileText} title="PDF Reader" colorClass="bg-red-500/20 text-red-400">
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60">
        <span className="shrink-0">📄</span>
        <span className="truncate">{fileName}</span>
        {pageCount ? (
          <span className="ml-auto shrink-0 text-[9px] text-slate-400 bg-dark-800 px-1.5 py-0.5 rounded">
            {pageCount}p
          </span>
        ) : null}
      </div>
      {text && (
        <div className="mt-1.5 text-[10px] text-slate-500 leading-snug line-clamp-2">
          {text.slice(0, 90)}…
        </div>
      )}
    </BaseNode>
  );
}

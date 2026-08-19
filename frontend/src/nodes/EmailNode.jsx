import React from 'react';
import { BaseNode } from './BaseNode';
import { Mail } from 'lucide-react';

export function EmailNode(props) {
  const to = props.data?.to || 'recipient@…';
  const subject = props.data?.subject || '(no subject)';
  return (
    <BaseNode id={props.id} data={props.data} icon={Mail} title="Send Email" colorClass="bg-sky-500/20 text-sky-400">
      <div className="font-mono text-[11px] text-slate-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 space-y-0.5">
        <div className="truncate"><span className="text-slate-500">to:</span> {to}</div>
        <div className="truncate"><span className="text-slate-500">re:</span> {subject}</div>
      </div>
      <div className="text-[10px] text-slate-500 pt-1">Sends via SMTP (vault-stored creds)</div>
    </BaseNode>
  );
}

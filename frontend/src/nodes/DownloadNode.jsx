import React from 'react';
import { BaseNode } from './BaseNode';
import { Download } from 'lucide-react';

export function DownloadNode(props) {
  const fileName = props.data?.fileName || 'output.txt';

  return (
    <BaseNode id={props.id} data={props.data} icon={Download} title="Download Result" colorClass="bg-cyan-500/20 text-cyan-400">
      <div className="font-mono text-[11px] text-cyan-300 bg-dark-900/60 p-2 rounded border border-dark-700/60 truncate">
        💾 {fileName}
      </div>
    </BaseNode>
  );
}

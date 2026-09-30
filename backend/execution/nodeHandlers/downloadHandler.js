import { resolveVariables } from '../utils/variableResolver.js';

export async function downloadHandler(node, context) {
  const nodeData = node.data || {};
  const rawInput = nodeData.text || nodeData.content || '{{ollama.text}}';
  const fileName = nodeData.fileName || 'result.txt';

  const resolvedContent = resolveVariables(rawInput, context);

  return {
    downloadUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(resolvedContent)}`,
    fileName,
    content: resolvedContent,
    sizeBytes: Buffer.byteLength(resolvedContent, 'utf8')
  };
}

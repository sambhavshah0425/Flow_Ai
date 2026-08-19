import { resolveVariables } from '../utils/variableResolver.js';

export async function pdfHandler(node, context) {
  const nodeData = node.data || {};
  const rawText = nodeData.text || nodeData.content || 'Sample PDF Document Content\nChapter 1: Artificial Intelligence Workflow Systems.';
  
  const resolvedContent = resolveVariables(rawText, context);

  return {
    text: resolvedContent,
    fileName: nodeData.fileName || 'document.pdf',
    pageCount: nodeData.pageCount || 1,
    charCount: resolvedContent.length,
    extractedAt: new Date().toISOString()
  };
}

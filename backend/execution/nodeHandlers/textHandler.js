import { resolveVariables } from '../utils/variableResolver.js';

export async function textHandler(node, context) {
  const nodeData = node.data || {};
  const rawText = nodeData.text || nodeData.content || '';
  
  // Resolve placeholders like {{secrets.KEY}} or {{pdf_1.output}}
  const resolvedText = resolveVariables(rawText, context);

  return {
    text: resolvedText,
    charCount: resolvedText.length,
    timestamp: new Date().toISOString()
  };
}

import { TextNode } from './TextNode';
import { PDFNode } from './PDFNode';
import { APINode } from './APINode';
import { DelayNode } from './DelayNode';
import { DownloadNode } from './DownloadNode';
import { ConditionNode } from './ConditionNode';
import { EmbedNode } from './EmbedNode';
import { RetrieveNode } from './RetrieveNode';
import { EmailNode } from './EmailNode';
import { OllamaNode } from './OllamaNode';

export const nodeTypes = {
  text: TextNode,
  pdf: PDFNode,
  api: APINode,
  delay: DelayNode,
  download: DownloadNode,
  condition: ConditionNode,
  embed: EmbedNode,
  retrieve: RetrieveNode,
  email: EmailNode,
  ollama: OllamaNode,
  // Legacy: workflows saved with Gemini nodes now render (and run) as Local AI
  gemini: OllamaNode
};

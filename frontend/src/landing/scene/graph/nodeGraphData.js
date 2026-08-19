/**
 * The hero's 3D workflow graph — same real FlowForge node types and pipeline
 * shape as the 2D fallback (NodeNetwork.jsx): Text Input + PDF Reader feed a
 * Gemini AI node, whose output fans out to REST API, Delay Timer, and
 * Download. Kept in one place so the 3D scene and the accessible text
 * description stay in sync. Colors match the Tailwind accent tokens
 * (brand/aiv/flow/run) so the WebGL layer reads as the same system as the
 * HTML layer.
 */
export const GRAPH_NODES = [
  { id: 'text_1', label: 'Text Input', sub: 'prompt · {{text_1.text}}', color: '#38bdf8', position: [-3.2, 0.85, -0.4], status: 'done' },
  { id: 'pdf_1', label: 'PDF Reader', sub: '11 pages extracted', color: '#38bdf8', position: [-3.2, -0.85, -1.3], status: 'done' },
  { id: 'gemini_1', label: 'Gemini AI', sub: 'Summarize {{pdf_1.text}}', color: '#6366f1', position: [0, 0, 0.4], status: 'running' },
  { id: 'api_1', label: 'REST API', sub: 'POST /notify · 200 OK', color: '#38bdf8', position: [3.2, 1.2, -0.6], status: 'queued' },
  { id: 'delay_1', label: 'Delay Timer', sub: 'wait 1900 ms', color: '#38bdf8', position: [3.2, 0, -1.4], status: 'queued' },
  { id: 'download_1', label: 'Download', sub: 'ai_summary.txt', color: '#38bdf8', position: [3.2, -1.2, -2.2], status: 'queued' },
];

export const GRAPH_EDGES = [
  { from: 'text_1', to: 'gemini_1' },
  { from: 'pdf_1', to: 'gemini_1' },
  { from: 'gemini_1', to: 'api_1' },
  { from: 'gemini_1', to: 'delay_1' },
  { from: 'delay_1', to: 'download_1' },
];

export const GRAPH_DESCRIPTION =
  'Animated 3D diagram of a FlowForge OS pipeline: Text Input and PDF Reader nodes feed a Gemini AI node, whose output flows to REST API, Delay Timer, and Download nodes, with data pulses traveling along the connections.';

import { ollamaChat, ollamaStatus, ollamaWarmup } from '../utils/ollamaClient.js';
import { normalizeAndValidateWorkflow } from './aiWorkflowController.js';
import { parseDAG } from '../execution/dagParser.js';

/**
 * Conversational workflow copilot, powered by a local Qwen model via Ollama.
 *
 * Each turn the model either asks the user ONE clarifying question ("ask") or
 * returns a complete workflow ("build"), which the frontend drops onto the canvas.
 * No training involved: the node catalog below is the model's whole "manual".
 */

const NODE_TYPES = ['text', 'ollama', 'api', 'pdf', 'embed', 'retrieve', 'condition', 'email', 'delay', 'download'];

// A 1.7B model needs this level of detail to build complete workflows (a
// shorter prompt was tested: it produced one-node workflows). Its length costs
// nothing after the first read: Ollama caches the processed prompt, and
// POST /api/copilot/warmup reads it while the user is still typing.
// Missing email addresses are handled in code (checkEmailRecipients), not here.
export const SYSTEM_PROMPT = `You are FlowForge Copilot, the assistant inside a visual workflow builder.
You chat with the user, understand the automation they want, and build it as a workflow of connected nodes.

Answer with JSON: {"action": "ask" | "build", "reply": "...", "workflow": {...}}
- "build": "reply" = 1-2 friendly sentences saying what you built. Include the FULL workflow with EVERY step the user asked for.
- "ask": only if the task is impossible without an answer. ONE short question in "reply", no workflow.

Rules:
- Prefer building. If the user says "build it", "go" or "just do it", build immediately.
- Include every step of the request (e.g. "summarize and email" needs a pdf/text node, an ollama node AND an email node).
- Only add the nodes the task needs. Do not add delay or download nodes unless the user asks for them.
- If a current workflow is given and the user asks to change it, return the FULL updated workflow. For a new, unrelated request, ignore it and build a fresh one.

Workflow format:
- Node ids are lowercase: the type, an underscore, a number (text_1, ollama_1, email_1).
- Pass data between nodes with {{node_id.field}} inside data fields.
- Connect nodes in the order they run. Input nodes (pdf, text, api) may start the flow. No loops.
- Edges leaving a condition node need "sourceHandle": "true" or "false".

Node types (data fields -> outputs other nodes can use):
- text: {label, text} -> {{id.text}}. Fixed text or a user question.
- ollama: {label, prompt} -> {{id.text}}. Local AI. Use it for EVERY AI step: summarize, write, translate, classify, extract, answer.
- api: {label, url, method} -> {{id.data}}, {{id.status}}. HTTP request.
- pdf: {label, fileName} -> {{id.text}}. The user uploads the PDF on the canvas afterwards.
- embed: {label, text} -> indexes text so a retrieve node can search it.
- retrieve: {label, query, topK} -> {{id.context}}. Finds relevant passages. Must come after an embed node.
- condition: {label, leftValue, operator, rightValue}. operator: equals, not_equals, contains, not_contains, gt, lt, is_empty, is_not_empty. Branches "true"/"false".
- email: {label, to, subject, body}. SMTP login comes from the Secrets Vault automatically.
- delay: {label, delayMs}
- download: {label, fileName, text}. Lets the user download text as a file.

Example 1. User: "Summarize a PDF and email the summary to sam@x.com"
{"action": "build", "reply": "Built it: your PDF is summarized by AI and emailed to sam@x.com. Upload the PDF, then press Run.", "workflow": {"name": "PDF Summary Email", "nodes": [
 {"id": "pdf_1", "type": "pdf", "data": {"label": "Your PDF", "fileName": "document.pdf"}},
 {"id": "ollama_1", "type": "ollama", "data": {"label": "Summarize", "prompt": "Summarize this document in 5 bullet points:\\n\\n{{pdf_1.text}}"}},
 {"id": "email_1", "type": "email", "data": {"label": "Email summary", "to": "sam@x.com", "subject": "PDF summary", "body": "{{ollama_1.text}}"}}],
 "edges": [{"source": "pdf_1", "target": "ollama_1"}, {"source": "ollama_1", "target": "email_1"}]}}

Example 2. User: "Call https://api.site/health; if it returns 200 write a happy status note, otherwise write an alert"
{"action": "build", "reply": "Built it: the API is checked, and AI writes a status note or an alert depending on the result.", "workflow": {"name": "Health Check", "nodes": [
 {"id": "api_1", "type": "api", "data": {"label": "Health check", "url": "https://api.site/health", "method": "GET"}},
 {"id": "condition_1", "type": "condition", "data": {"label": "Is it 200?", "leftValue": "{{api_1.status}}", "operator": "equals", "rightValue": "200"}},
 {"id": "ollama_1", "type": "ollama", "data": {"label": "Happy note", "prompt": "Write a short upbeat note: the service is healthy."}},
 {"id": "ollama_2", "type": "ollama", "data": {"label": "Alert", "prompt": "Write a short alert: the health check returned {{api_1.status}}."}}],
 "edges": [{"source": "api_1", "target": "condition_1"}, {"source": "condition_1", "target": "ollama_1", "sourceHandle": "true"}, {"source": "condition_1", "target": "ollama_2", "sourceHandle": "false"}]}}

Example 3. User: "Let me ask questions about a document"
{"action": "build", "reply": "Built it: upload your document and type your question in the Question node, then press Run.", "workflow": {"name": "Document Q&A", "nodes": [
 {"id": "pdf_1", "type": "pdf", "data": {"label": "Your document", "fileName": "document.pdf"}},
 {"id": "text_1", "type": "text", "data": {"label": "Question", "text": "What is this document about?"}},
 {"id": "embed_1", "type": "embed", "data": {"label": "Index document", "text": "{{pdf_1.text}}"}},
 {"id": "retrieve_1", "type": "retrieve", "data": {"label": "Find answer", "query": "{{text_1.text}}", "topK": 4}},
 {"id": "ollama_1", "type": "ollama", "data": {"label": "Answer", "prompt": "Answer using only this context:\\n{{retrieve_1.context}}\\n\\nQuestion: {{text_1.text}}"}}],
 "edges": [{"source": "pdf_1", "target": "embed_1"}, {"source": "embed_1", "target": "retrieve_1"}, {"source": "text_1", "target": "retrieve_1"}, {"source": "retrieve_1", "target": "ollama_1"}]}}`;

// JSON schema handed to Ollama's `format` option: the model is forced to reply
// in exactly this shape, so parsing never depends on it "behaving".
export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['ask', 'build'] },
    reply: { type: 'string' },
    workflow: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: NODE_TYPES },
              data: { type: 'object' }
            },
            required: ['id', 'type', 'data']
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              sourceHandle: { type: 'string' }
            },
            required: ['source', 'target']
          }
        }
      },
      required: ['name', 'nodes', 'edges']
    }
  },
  required: ['action', 'reply']
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const KEEP_HISTORY = 12;

/**
 * Lay nodes out left-to-right by dependency depth, centring each column
 * vertically, so branches (true/false) don't pile on top of each other.
 */
export function autoLayout(nodes, edges) {
  const { levels } = parseDAG(nodes, edges);
  const positions = {};
  levels.forEach((levelNodes, col) => {
    levelNodes.forEach((node, row) => {
      positions[node.id] = {
        x: 100 + col * 340,
        y: 200 + (row - (levelNodes.length - 1) / 2) * 170
      };
    });
  });
  return nodes.map((n) => ({ ...n, position: positions[n.id] || n.position }));
}

/**
 * Compact view of the current canvas for the model: ids, types and data only,
 * with long strings (e.g. extracted PDF text) and SMTP plumbing trimmed out.
 */
export function summarizeCanvas(workflow) {
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) return null;
  const HIDDEN = new Set(['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'extractedChars', 'pageCount']);
  const nodes = workflow.nodes.slice(0, 30).map((n) => {
    const data = {};
    for (const [k, v] of Object.entries(n.data || {})) {
      if (HIDDEN.has(k)) continue;
      data[k] = typeof v === 'string' && v.length > 300 ? `${v.slice(0, 300)}…` : v;
    }
    return { id: n.id, type: n.type, data };
  });
  const edges = (workflow.edges || []).slice(0, 60).map((e) => ({
    source: e.source,
    target: e.target,
    ...(e.sourceHandle && { sourceHandle: e.sourceHandle })
  }));
  return { name: workflow.name || 'Untitled Workflow', nodes, edges };
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
export const EMAIL_QUESTION = 'Which email address should I send it to?';

/**
 * Small models happily invent recipients like "user@example.com". This check
 * does not trust the model: an email node may only target an address the user
 * actually typed (or one already on the canvas, or a {{template}}).
 *
 * Returns 'ok' (possibly after fixing `to` in place with the user's latest
 * address), or 'ask' when the user never gave one and hasn't been asked yet.
 */
export function checkEmailRecipients(workflow, messages, currentWorkflow) {
  const emailNodes = workflow.nodes.filter((n) => n.type === 'email');
  if (emailNodes.length === 0) return 'ok';

  const userEmails = messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => m.content.match(EMAIL_RE) || []);
  const canvasEmails = (currentWorkflow?.nodes || [])
    .filter((n) => n.type === 'email' && typeof n.data?.to === 'string')
    .map((n) => n.data.to.trim());
  const known = new Set([...userEmails, ...canvasEmails]);
  const latest = userEmails[userEmails.length - 1];
  const alreadyAsked = messages.some((m) => m.role === 'assistant' && m.content === EMAIL_QUESTION);

  for (const node of emailNodes) {
    const to = String(node.data.to || '').trim();
    if (to.includes('{{') || known.has(to)) continue;
    if (latest) {
      node.data.to = latest;
    } else if (!alreadyAsked) {
      return 'ask';
    } else {
      node.data.to = ''; // user declined to give one; they can fill it in the Email node
    }
  }
  return 'ok';
}

function parseModelJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** GET /api/copilot/status — is Ollama running and is the model pulled? */
export async function getCopilotStatus(req, res) {
  const status = await ollamaStatus();
  return res.status(200).json({ success: true, ...status });
}

let warmupInFlight = null;

/**
 * POST /api/copilot/warmup — called when the chat panel opens. Starts loading
 * the model and reading SYSTEM_PROMPT in the background, then replies at once,
 * so that work happens while the user types instead of after they hit Send.
 */
export async function copilotWarmup(req, res) {
  if (!warmupInFlight) {
    warmupInFlight = ollamaWarmup(SYSTEM_PROMPT).finally(() => { warmupInFlight = null; });
  }
  return res.status(202).json({ success: true, warming: true });
}

/**
 * POST /api/copilot/chat
 * Body: { messages: [{ role: 'user'|'assistant', content }], currentWorkflow?: { name, nodes, edges } }
 * Returns: { success, action: 'ask'|'build', reply, workflow? }
 */
export async function copilotChat(req, res) {
  const { messages, currentWorkflow } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'messages must be a non-empty array.' });
  }
  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ success: false, message: `Too many messages (max ${MAX_MESSAGES}). Start a new chat.` });
  }
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim()) {
      return res.status(400).json({ success: false, message: 'Each message needs a role (user/assistant) and non-empty content.' });
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ success: false, message: `Messages must be under ${MAX_MESSAGE_CHARS} characters.` });
    }
  }
  if (messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ success: false, message: 'The last message must be from the user.' });
  }

  const canvas = summarizeCanvas(currentWorkflow);
  const modelMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(canvas ? [{ role: 'system', content: `Current workflow on the canvas:\n${JSON.stringify(canvas)}` }] : []),
    ...messages.slice(-KEEP_HISTORY).map((m) => ({ role: m.role, content: m.content }))
  ];

  let result;
  try {
    result = await ollamaChat({ messages: modelMessages, format: RESPONSE_SCHEMA, temperature: 0.2 });
  } catch (err) {
    // Ollama offline / model missing / timeout — the message says how to fix it.
    return res.status(503).json({ success: false, message: err.message });
  }

  const parsed = parseModelJson(result.text);
  if (!parsed || typeof parsed.reply !== 'string') {
    return res.status(200).json({
      success: true,
      action: 'ask',
      reply: "Sorry, I got confused there. Could you describe what you want the workflow to do in one or two sentences?",
      model: result.model
    });
  }

  if (parsed.action !== 'build' || !parsed.workflow) {
    return res.status(200).json({ success: true, action: 'ask', reply: parsed.reply, model: result.model });
  }

  try {
    const normalized = normalizeAndValidateWorkflow(parsed.workflow);

    if (checkEmailRecipients(normalized, messages, currentWorkflow) === 'ask') {
      return res.status(200).json({ success: true, action: 'ask', reply: EMAIL_QUESTION, model: result.model });
    }
    const missingRecipient = normalized.nodes.some((n) => n.type === 'email' && !n.data.to);

    const nodes = autoLayout(normalized.nodes, normalized.edges);
    return res.status(200).json({
      success: true,
      action: 'build',
      reply: missingRecipient ? `${parsed.reply} (Add the recipient's address in the Email node.)` : parsed.reply,
      workflow: { name: normalized.name, description: normalized.description, nodes, edges: normalized.edges },
      model: result.model
    });
  } catch (err) {
    // The model produced something unusable (no nodes, a loop...). Ask the user to retry.
    return res.status(200).json({
      success: true,
      action: 'ask',
      reply: `I tried to build that but the result wasn't a valid workflow (${err.message}). Could you rephrase or simplify the request?`,
      model: result.model
    });
  }
}

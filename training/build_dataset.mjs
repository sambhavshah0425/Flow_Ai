/**
 * Builds validated training & evaluation datasets for Flow_Ai:
 * - training/dist/copilot_train.jsonl & copilot_eval.jsonl (Chat with Qwen Bot)
 * - training/dist/train.jsonl & eval.jsonl (Combined Copilot + Execution Node data)
 *
 * Usage:
 *   node training/build_dataset.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeAndValidateWorkflow } from '../backend/controllers/aiWorkflowController.js';
import { stripRedundantTextSinks } from '../backend/utils/workflowPostProcess.js';
import { SYSTEM_PROMPT as COPILOT_SYSTEM_PROMPT, summarizeCanvas } from '../backend/controllers/copilotController.js';
import { toPlainEnglish } from '../backend/utils/plainText.js';
import { RAW_COPILOT_CONVERSATIONS } from './copilot_examples.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const CUSTOM_FILE = path.join(__dirname, 'custom_examples.jsonl');
const CUSTOM_COPILOT_FILE = path.join(__dirname, 'custom_copilot_examples.jsonl');

const RAG_SYS =
  'Write in simple plain English with no Markdown symbols (no **, *, #, or backticks). Answer strictly and exclusively using facts present in the provided context. If the answer is missing from the context, reply exactly: "Not found in the provided context." Never invent facts.';
const JSON_SYS =
  'Return ONLY a valid JSON object or array matching the requested fields. Do not include prose, explanations, or markdown outside the JSON.';
const CONCISE_SYS =
  'Write in simple, clear plain English with no Markdown symbols (no **, *, #, or backticks). Be accurate, direct, and concise with no filler.';

function compileCopilotRow(conv, idx) {
  const canvasSummary = conv.canvas ? summarizeCanvas(conv.canvas) : null;
  const messages = [
    { role: 'system', content: COPILOT_SYSTEM_PROMPT },
    ...(canvasSummary ? [{ role: 'system', content: `Current workflow on the canvas:\n${JSON.stringify(canvasSummary)}` }] : [])
  ];

  for (const turn of conv.turns) {
    if (turn.role === 'user') {
      messages.push({ role: 'user', content: turn.content });
      continue;
    }

    const payload = { ...turn.payload };
    if (typeof payload.reply === 'string') {
      payload.reply = toPlainEnglish(payload.reply);
    }
    if (payload.action === 'build') {
      const cleaned = stripRedundantTextSinks(normalizeAndValidateWorkflow(payload.workflow));
      payload.workflow = summarizeCanvas(cleaned);
    }
    messages.push({ role: 'assistant', content: JSON.stringify(payload) });
  }

  if (messages[messages.length - 1].role !== 'assistant') {
    throw new Error(`copilot example ${idx} must end with an assistant turn`);
  }
  return { messages };
}

const nodeExecutionExamples = [
  {
    messages: [
      { role: 'system', content: RAG_SYS },
      {
        role: 'user',
        content:
          'Context:\nFlowForge executes DAG workflows level-by-level via Socket.IO. Secrets are encrypted with AES-256-GCM.\n\nQuestion: How does FlowForge encrypt secrets?'
      },
      { role: 'assistant', content: 'FlowForge encrypts secrets using AES-256-GCM.' }
    ]
  },
  {
    messages: [
      { role: 'system', content: RAG_SYS },
      {
        role: 'user',
        content:
          'Context:\nFlowForge executes DAG workflows level-by-level via Socket.IO. Secrets are encrypted with AES-256-GCM.\n\nQuestion: Which cloud AWS region does FlowForge deploy to?'
      },
      { role: 'assistant', content: 'Not found in the provided context.' }
    ]
  },
  {
    messages: [
      { role: 'system', content: JSON_SYS },
      {
        role: 'user',
        content:
          'Extract {"service": string, "status": "ok"|"degraded"|"down", "latency_ms": number} from:\nAPI gateway health check succeeded in 42ms with all checks passing.'
      },
      { role: 'assistant', content: '{"service":"API gateway","status":"ok","latency_ms":42}' }
    ]
  },
  {
    messages: [
      { role: 'system', content: CONCISE_SYS },
      {
        role: 'user',
        content:
          'Summarize the root cause and fix from this log:\n"ERROR: MongoServerSelectionError timed out at 127.0.0.1:27017. Fallback activated: In-Memory Mode. After starting mongod on port 27017, health check reported database connected."'
      },
      {
        role: 'assistant',
        content:
          'Root Cause: Local MongoDB (127.0.0.1:27017) was unreachable, causing the backend to start in In-Memory Mode.\nResolution: Starting mongod on port 27017 restored full database connectivity.'
      }
    ]
  }
];

function loadJsonlFile(filePath, label) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    const parsed = JSON.parse(line);
    if (!Array.isArray(parsed.messages) || parsed.messages.length < 2) {
      throw new Error(`${label} line ${idx + 1} must have a "messages" array`);
    }
    return parsed;
  });
}

function splitAndWrite(rows, trainName, evalName) {
  const evalSet = rows.filter((_, idx) => idx % 5 === 0);
  const trainSet = rows.filter((_, idx) => idx % 5 !== 0);
  fs.writeFileSync(path.join(DIST_DIR, trainName), trainSet.map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(path.join(DIST_DIR, evalName), evalSet.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return { train: trainSet.length, eval: evalSet.length };
}

function main() {
  const builtInCopilot = RAW_COPILOT_CONVERSATIONS.map(compileCopilotRow);
  const customCopilot = loadJsonlFile(CUSTOM_COPILOT_FILE, 'custom_copilot_examples.jsonl');
  const copilotRows = [...builtInCopilot, ...customCopilot];

  const customGeneral = loadJsonlFile(CUSTOM_FILE, 'custom_examples.jsonl');
  const allRows = [...copilotRows, ...nodeExecutionExamples, ...customGeneral];

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const copilotCounts = splitAndWrite(copilotRows, 'copilot_train.jsonl', 'copilot_eval.jsonl');
  const allCounts = splitAndWrite(allRows, 'train.jsonl', 'eval.jsonl');

  console.log(
    `Copilot dataset: ${copilotCounts.train} train + ${copilotCounts.eval} eval (${customCopilot.length} saved from UI) -> training/dist/copilot_*.jsonl`
  );
  console.log(
    `Full dataset:    ${allCounts.train} train + ${allCounts.eval} eval -> training/dist/train.jsonl & eval.jsonl`
  );
}

main();

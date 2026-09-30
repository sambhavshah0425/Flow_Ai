import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseDAG } from '../execution/dagParser.js';
import { getDecryptedUserSecrets } from './secretController.js';

// SSRF Protection: Private / loopback hostnames and IP patterns
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS / cloud metadata endpoint
  /^::1$/,
  /^fe80::/i
];

/**
 * Validates a URL to prevent SSRF vulnerabilities.
 * Allows valid public HTTP/HTTPS URLs and template strings.
 */
export function sanitizeAndValidateUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'https://jsonplaceholder.typicode.com/posts/1';
  }

  const trimmed = url.trim();

  // If it's a dynamic template string (e.g. {{variables.url}}), permit it
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'https://jsonplaceholder.typicode.com/posts/1';
    }

    const hostname = parsed.hostname;
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        console.warn(`[SSRF Guard] Blocked potentially unsafe host "${hostname}". Falling back to safe public endpoint.`);
        return 'https://jsonplaceholder.typicode.com/posts/1';
      }
    }

    return trimmed;
  } catch {
    // If URL parsing fails, default to a safe mock endpoint
    return 'https://jsonplaceholder.typicode.com/posts/1';
  }
}

/**
 * System prompt definition for Gemini Meta-Planner
 */
const SYSTEM_PROMPT = `
You are the FlowForge OS Master AI Workflow Architect.
Your task is to take a natural language goal from a user and generate a complete, valid, directed acyclic graph (DAG) workflow.

You have access to the following 10 FlowForge node types:
1. "text": Text payload / user prompt.
   data schema: { label: string, text: string }
   output reference: {{<nodeId>.text}}

2. "gemini": Google Gemini AI reasoning / transformation.
   data schema: { label: string, prompt: string, model: "gemini-flash-latest"|"gemini-1.5-flash", temperature: number, maxRetries: number, retryDelayMs: number }
   output reference: {{<nodeId>.text}}

3. "api": HTTP REST API request.
   data schema: { label: string, url: string, method: "GET"|"POST"|"PUT"|"DELETE", headers: object, body?: any, timeoutMs: number }
   output reference: {{<nodeId>.data}}, {{<nodeId>.status}}

4. "condition": Branching logical if-condition.
   data schema: { label: string, leftValue: string, operator: "equals"|"not_equals"|"contains"|"not_contains"|"starts_with"|"ends_with"|"gt"|"gte"|"lt"|"lte"|"is_empty"|"is_not_empty"|"is_true"|"is_false", rightValue: string }
   output reference: {{<nodeId>.branch}}, {{<nodeId>.result}}
   special note: When routing out of a condition node, set edge.sourceHandle = "true" or "false".

5. "pdf": Document extraction.
   data schema: { label: string, fileName: string, text: string }
   output reference: {{<nodeId>.text}}

6. "embed": Text chunking & vector embedding.
   data schema: { label: string, text: string, chunkSize: number, overlap: number }
   output reference: {{<nodeId>.chunks}}

7. "retrieve": Semantic / vector search against indexed embeddings.
   data schema: { label: string, query: string, topK: number }
   output reference: {{<nodeId>.text}}, {{<nodeId>.results}}

8. "email": SMTP notification email.
   data schema: { label: string, to: string, subject: string, body: string, isHtml: boolean, smtpHost: "{{secrets.SMTP_HOST}}", smtpPort: 587, smtpUser: "{{secrets.SMTP_USER}}", smtpPass: "{{secrets.SMTP_PASS}}" }

9. "delay": Timer wait.
   data schema: { label: string, delayMs: number }

10. "download": Browser file download / export.
    data schema: { label: string, fileName: string, text: string }

Variable Interpolation Rules:
- Downstream nodes MUST reference upstream node outputs via {{<sourceNodeId>.<field>}} (e.g., prompt: "Summarize: {{api_1.data}}").
- Ensure all edges connect source to target nodes properly in a strictly acyclic (DAG) structure.
- Assign clear, clean visual (x, y) coordinates with horizontal flow (e.g. col 0: x=100, col 1: x=450, col 2: x=800, y=150).

Output must be STRICT JSON matching this schema:
{
  "name": "Concise workflow name",
  "description": "Short explanation of the pipeline",
  "nodes": [
    {
      "id": "node_id",
      "type": "text"|"gemini"|"api"|"condition"|"pdf"|"embed"|"retrieve"|"email"|"delay"|"download",
      "position": { "x": number, "y": number },
      "data": { "label": string, ... }
    }
  ],
  "edges": [
    {
      "id": "e_<source>_<target>",
      "source": "source_node_id",
      "target": "target_node_id",
      "sourceHandle": "true" | "false" | null,
      "targetHandle": null,
      "animated": true,
      "type": "smoothstep"
    }
  ]
}
`;

/**
 * Deterministic Intent Pattern Matcher (used when offline or no Gemini API Key is available)
 */
export function generateFallbackWorkflow(prompt = '') {
  const p = prompt.toLowerCase();

  // Pattern 1: Conditional Alert / Email Routing (check this before generic 'api')
  if (p.includes('email') || p.includes('alert') || p.includes('notify') || p.includes('condition') || p.includes('check')) {
    return {
      name: 'Intelligent Alert & Notification Router',
      description: 'Monitors endpoint, evaluates logic condition, and dispatches automated alerts.',
      nodes: [
        {
          id: 'api_1',
          type: 'api',
          position: { x: 100, y: 150 },
          data: {
            label: 'Health Check API',
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET'
          }
        },
        {
          id: 'condition_1',
          type: 'condition',
          position: { x: 450, y: 150 },
          data: {
            label: 'Status Check',
            leftValue: '{{api_1.status}}',
            operator: 'equals',
            rightValue: '200'
          }
        },
        {
          id: 'email_1',
          type: 'email',
          position: { x: 800, y: 50 },
          data: {
            label: 'Send Success Alert',
            to: 'admin@flowforge.ai',
            subject: 'System Check Succeeded',
            body: 'Service is healthy: {{api_1.data}}',
            smtpHost: '{{secrets.SMTP_HOST}}',
            smtpPort: 587,
            smtpUser: '{{secrets.SMTP_USER}}',
            smtpPass: '{{secrets.SMTP_PASS}}'
          }
        },
        {
          id: 'delay_1',
          type: 'delay',
          position: { x: 800, y: 250 },
          data: {
            label: 'Wait & Retry Delay',
            delayMs: 2000
          }
        }
      ],
      edges: [
        { id: 'e_api_cond', source: 'api_1', target: 'condition_1', animated: true, type: 'smoothstep' },
        { id: 'e_cond_email', source: 'condition_1', target: 'email_1', sourceHandle: 'true', animated: true, type: 'smoothstep', style: { stroke: '#34d399', strokeWidth: 2 } },
        { id: 'e_cond_delay', source: 'condition_1', target: 'delay_1', sourceHandle: 'false', animated: true, type: 'smoothstep', style: { stroke: '#f43f5e', strokeWidth: 2 } }
      ]
    };
  }

  // Pattern 2: PDF Document RAG (Embed & Retrieve)
  if (p.includes('pdf') || p.includes('document') || p.includes('doc') || p.includes('rag') || p.includes('embed') || p.includes('search')) {
    return {
      name: 'Document RAG & Semantic QA',
      description: 'Ingests PDF document, computes embeddings, retrieves relevant chunks, and answers queries.',
      nodes: [
        {
          id: 'pdf_1',
          type: 'pdf',
          position: { x: 100, y: 150 },
          data: {
            label: 'PDF Ingestion',
            fileName: 'sample_document.pdf',
            text: 'FlowForge OS Architecture and Agentic AI Orchestration Guidelines.'
          }
        },
        {
          id: 'embed_1',
          type: 'embed',
          position: { x: 400, y: 150 },
          data: {
            label: 'Vector Chunk & Embed',
            text: '{{pdf_1.text}}',
            chunkSize: 900,
            overlap: 150
          }
        },
        {
          id: 'retrieve_1',
          type: 'retrieve',
          position: { x: 700, y: 150 },
          data: {
            label: 'Semantic Search',
            query: prompt || 'What are the main architecture components?',
            topK: 4
          }
        },
        {
          id: 'gemini_1',
          type: 'gemini',
          position: { x: 1000, y: 150 },
          data: {
            label: 'Gemini RAG Synthesizer',
            prompt: `Context retrieved from document:\n{{retrieve_1.text}}\n\nUser Question: ${prompt}\n\nProvide a precise, grounded answer:`,
            model: 'gemini-flash-latest',
            temperature: 0.3
          }
        },
        {
          id: 'download_1',
          type: 'download',
          position: { x: 1300, y: 150 },
          data: {
            label: 'Save RAG Answer',
            fileName: 'rag_qa_result.txt',
            text: '{{gemini_1.text}}'
          }
        }
      ],
      edges: [
        { id: 'e_pdf_embed', source: 'pdf_1', target: 'embed_1', animated: true, type: 'smoothstep' },
        { id: 'e_embed_retrieve', source: 'embed_1', target: 'retrieve_1', animated: true, type: 'smoothstep' },
        { id: 'e_retrieve_gemini', source: 'retrieve_1', target: 'gemini_1', animated: true, type: 'smoothstep' },
        { id: 'e_gemini_download', source: 'gemini_1', target: 'download_1', animated: true, type: 'smoothstep' }
      ]
    };
  }

  // Pattern 3: API Fetch & Summarize
  if (p.includes('api') || p.includes('fetch') || p.includes('url') || p.includes('http') || p.includes('summarize')) {
    return {
      name: 'API Data Intelligence & Export',
      description: 'Fetches REST data from API, synthesizes insights with Gemini AI, and exports file output.',
      nodes: [
        {
          id: 'api_1',
          type: 'api',
          position: { x: 100, y: 150 },
          data: {
            label: 'Fetch REST API',
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET',
            timeoutMs: 10000
          }
        },
        {
          id: 'gemini_1',
          type: 'gemini',
          position: { x: 450, y: 150 },
          data: {
            label: 'Gemini Insight Engine',
            prompt: `Analyze the following payload and extract key insights and summary:\n\n{{api_1.data}}\n\nUser request: ${prompt}`,
            model: 'gemini-flash-latest',
            temperature: 0.7,
            maxRetries: 1,
            retryDelayMs: 500
          }
        },
        {
          id: 'download_1',
          type: 'download',
          position: { x: 800, y: 150 },
          data: {
            label: 'Export Insights',
            fileName: 'api_analysis_report.txt',
            text: '{{gemini_1.text}}'
          }
        }
      ],
      edges: [
        { id: 'e_api_gemini', source: 'api_1', target: 'gemini_1', animated: true, type: 'smoothstep' },
        { id: 'e_gemini_download', source: 'gemini_1', target: 'download_1', animated: true, type: 'smoothstep' }
      ]
    };
  }

  // Default Pattern: Text Prompt to Gemini to Download
  return {
    name: 'AI Agent Generation Pipeline',
    description: 'Autonomous multi-step pipeline synthesized from user goal.',
    nodes: [
      {
        id: 'text_1',
        type: 'text',
        position: { x: 100, y: 150 },
        data: {
          label: 'User Goal Prompt',
          text: prompt || 'Analyze trends in modern workflow automation.'
        }
      },
      {
        id: 'gemini_1',
        type: 'gemini',
        position: { x: 450, y: 150 },
        data: {
          label: 'Gemini Executive Engine',
          prompt: `Execute the following objective with full details:\n\n{{text_1.text}}`,
          model: 'gemini-flash-latest',
          temperature: 0.7,
          maxRetries: 1,
          retryDelayMs: 500
        }
      },
      {
        id: 'download_1',
        type: 'download',
        position: { x: 800, y: 150 },
        data: {
          label: 'Save Output File',
          fileName: 'workflow_output.txt',
          text: '{{gemini_1.text}}'
        }
      }
    ],
    edges: [
      { id: 'e_text_gemini', source: 'text_1', target: 'gemini_1', animated: true, type: 'smoothstep' },
      { id: 'e_gemini_download', source: 'gemini_1', target: 'download_1', animated: true, type: 'smoothstep' }
    ]
  };
}

/**
 * 4-Phase Schema Normalizer and DAG Validator
 */
export function normalizeAndValidateWorkflow(rawWorkflow) {
  if (!rawWorkflow || typeof rawWorkflow !== 'object') {
    throw new Error('Invalid workflow object generated.');
  }

  const name = (rawWorkflow.name || 'AI Generated Workflow').slice(0, 80);
  const description = (rawWorkflow.description || '').slice(0, 300);
  const rawNodes = Array.isArray(rawWorkflow.nodes) ? rawWorkflow.nodes : [];
  const rawEdges = Array.isArray(rawWorkflow.edges) ? rawWorkflow.edges : [];

  if (rawNodes.length === 0) {
    throw new Error('Generated workflow has no nodes.');
  }

  // Phase 1 & 2: Normalize Nodes
  const validTypes = new Set(['text', 'gemini', 'ollama', 'api', 'condition', 'pdf', 'embed', 'retrieve', 'email', 'delay', 'download']);
  const nodeMap = new Map();
  const normalizedNodes = [];

  rawNodes.forEach((n, idx) => {
    const id = (n.id || `node_${idx + 1}`).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const type = validTypes.has(n.type?.toLowerCase()) ? n.type.toLowerCase() : 'text';
    const posX = typeof n.position?.x === 'number' ? n.position.x : 100 + idx * 350;
    const posY = typeof n.position?.y === 'number' ? n.position.y : 150;

    const data = { ...(n.data || {}) };
    data.label = data.label || `${type.toUpperCase()} Node`;

    // Apply specific security & default normalizations per node type
    if (type === 'api') {
      data.url = sanitizeAndValidateUrl(data.url);
      data.method = (data.method || 'GET').toUpperCase();
    } else if (type === 'gemini') {
      data.model = data.model || 'gemini-flash-latest';
      data.prompt = data.prompt || 'Process input: {{text_1.text}}';
    } else if (type === 'ollama') {
      data.prompt = data.prompt || 'Process input: {{text_1.text}}';
    } else if (type === 'condition') {
      data.operator = data.operator || 'contains';
      data.leftValue = data.leftValue || '';
      data.rightValue = data.rightValue || '';
    } else if (type === 'download') {
      data.fileName = data.fileName || 'output.txt';
      data.text = data.text || 'Output payload';
    } else if (type === 'email') {
      data.smtpHost = data.smtpHost || '{{secrets.SMTP_HOST}}';
      data.smtpPort = data.smtpPort || 587;
      data.smtpUser = data.smtpUser || '{{secrets.SMTP_USER}}';
      data.smtpPass = data.smtpPass || '{{secrets.SMTP_PASS}}';
    }

    const normalizedNode = {
      id,
      type,
      position: { x: posX, y: posY },
      data
    };

    nodeMap.set(id, normalizedNode);
    normalizedNodes.push(normalizedNode);
  });

  // Phase 3: Normalize Edges & check valid connections
  const normalizedEdges = [];
  const edgeSet = new Set();

  rawEdges.forEach((e, idx) => {
    if (!e || typeof e !== 'object') return;
    const source = e.source?.toLowerCase();
    const target = e.target?.toLowerCase();

    if (source && target && nodeMap.has(source) && nodeMap.has(target) && source !== target) {
      const edgeKey = `${source}->${target}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        const sourceNode = nodeMap.get(source);
        const isCondition = sourceNode.type === 'condition';

        const branchColor = e.sourceHandle === 'true' ? '#34d399' : e.sourceHandle === 'false' ? '#f43f5e' : undefined;

        normalizedEdges.push({
          id: e.id || `e_${source}_to_${target}_${idx}`,
          source,
          target,
          sourceHandle: isCondition ? (e.sourceHandle || 'true') : undefined,
          targetHandle: e.targetHandle || undefined,
          animated: true,
          type: 'smoothstep',
          ...(branchColor && { style: { stroke: branchColor, strokeWidth: 2 } })
        });
      }
    }
  });

  // Phase 4: Reconcile missing edges for linear chains if edges were empty
  if (normalizedEdges.length === 0 && normalizedNodes.length > 1) {
    for (let i = 0; i < normalizedNodes.length - 1; i++) {
      normalizedEdges.push({
        id: `e_${normalizedNodes[i].id}_to_${normalizedNodes[i + 1].id}`,
        source: normalizedNodes[i].id,
        target: normalizedNodes[i + 1].id,
        animated: true,
        type: 'smoothstep'
      });
    }
  }

  // Validate DAG for cycles and topological integrity
  const parsed = parseDAG(normalizedNodes, normalizedEdges);

  return {
    name,
    description,
    nodes: normalizedNodes,
    edges: normalizedEdges,
    orderedNodes: parsed.orderedNodes
  };
}

/**
 * Controller endpoint: POST /api/workflows/generate-from-prompt
 */
export async function generateWorkflowFromPrompt(req, res) {
  try {
    const { prompt, autoRun } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty prompt describing your workflow is required.'
      });
    }

    const cleanPrompt = prompt.trim();
    const userId = req.user?._id || req.user?.id;

    // Check user's encrypted secrets or env for GEMINI_API_KEY
    const secrets = userId ? await getDecryptedUserSecrets(userId) : {};
    const apiKey = secrets.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    let generatedWorkflow = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-flash-latest',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          },
          systemInstruction: SYSTEM_PROMPT
        });

        const userGoalPrompt = `<user_goal>\n${cleanPrompt}\n</user_goal>`;
        
        // Wrap with a 6-second timeout so requests never hang on network delays
        const generatePromise = model.generateContent(userGoalPrompt);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out after 6000ms')), 6000)
        );

        const result = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response?.text();

        if (responseText) {
          const parsedJSON = JSON.parse(responseText);
          generatedWorkflow = normalizeAndValidateWorkflow(parsedJSON);
        }
      } catch (aiErr) {
        console.warn(`[AI Workflow Gen] Live Gemini attempt (${aiErr.message}) -> Served via deterministic fallback.`);
        generatedWorkflow = normalizeAndValidateWorkflow(generateFallbackWorkflow(cleanPrompt));
      }
    } else {
      // Offline / Free Tier Fallback Mode
      generatedWorkflow = normalizeAndValidateWorkflow(generateFallbackWorkflow(cleanPrompt));
    }

    return res.status(200).json({
      success: true,
      workflow: generatedWorkflow,
      autoRun: Boolean(autoRun),
      mode: apiKey ? 'live_ai' : 'fallback_matcher'
    });
  } catch (error) {
    console.error('Workflow generation error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to synthesize workflow: ${error.message}`
    });
  }
}

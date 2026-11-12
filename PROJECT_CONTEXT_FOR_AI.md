# Flow_Ai (FlowForge OS): Complete Project Context for AI Assistants

> **Purpose of this file:** give any AI model (or new developer) a complete, accurate mental model of this codebase in one read: what it does, how every part works, how data flows, the exact contracts between components, conventions, and known gaps. Everything below was verified against the source code, not copied from marketing text.

---

## 0. TL;DR (read this first)

- **What it is:** a self-hosted, **n8n-style visual workflow automation tool**. Users drag **nodes** onto a canvas, connect them with **edges**, and run the graph. The graph is a **DAG** (directed acyclic graph) executed on a Node.js backend.
- **AI:** all AI runs **locally via [Ollama](https://ollama.com)** using **Qwen** models (`qwen3:1.7b` for chat/generation by default, `qwen3-embedding:0.6b` for embeddings). No cloud AI keys are needed. Gemini was removed; `gemini` survives only as a legacy alias for the `ollama` node.
- **Stack:** MERN, so **MongoDB + Express + React + Node**.
  - Backend: Express 4, Mongoose 8, Socket.IO 4, JWT, bcryptjs, nodemailer, pdf-parse v2, axios. ES modules (`"type": "module"`). Tests use Vitest.
  - Frontend: React 18 + Vite 5, `@xyflow/react` (React Flow v12) canvas, Zustand stores, Tailwind CSS 3, socket.io-client, axios, lucide-react icons; landing page also uses framer-motion, three.js / react-three-fiber, lenis.
- **10 node types:** `text`, `pdf`, `ollama` (Local AI / Qwen), `api`, `condition`, `delay`, `download`, `embed`, `retrieve`, `email` (+ alias `gemini` → `ollama`).
- **Two AI builders:**
  1. **"Chat with Qwen"** is a multi-turn chat copilot (`POST /api/copilot/chat`) that asks clarifying questions or builds/edits the workflow on the canvas.
  2. **"AI Copilot" / "AI Prompt Automator"** is a one-shot prompt-to-workflow generator (`POST /api/workflows/generate-from-prompt`) with a deterministic keyword fallback when Ollama is down.
- **Execution:** HTTP call creates a *pending* execution → client joins a Socket.IO room → client emits `start_execution` → engine runs the DAG **level by level (nodes in the same level run in parallel)** and streams `node.*` / `workflow.*` events live.
- **Data passing between nodes:** template strings like `{{node_id.field}}`, `{{secrets.KEY}}`, resolved at run time.
- **Secrets:** stored AES-256-GCM encrypted in MongoDB, decrypted only at execution time and injected into templates.
- **Works without MongoDB** in development: every controller has an **in-memory fallback** (data lost on restart). In `NODE_ENV=production` the server refuses to start without the DB.
- Internal/brand names used interchangeably: **Flow_Ai**, **FlowAi**, **FlowForge OS**, **FlowForge**.

---

## 1. Repository layout

```
Flow_Ai/
├── package.json              # root convenience scripts (start, dev:backend, dev:frontend, build:frontend), name "flowforge-os"
├── start-windows.bat         # one-click Windows launcher: npm install if needed, copy .env.example→.env, start backend + frontend windows
├── README.md                 # public README
├── PROJECT_DOCUMENTATION.md  # older long-form docs (mostly accurate)
├── OLLAMA_QWEN_GUIDE.md      # how to install Ollama + pull Qwen models
├── PROJECT_CONTEXT_FOR_AI.md # ← this file
├── LICENSE                   # MIT
├── backend/
│   ├── server.js             # entry: loadEnv → http server → Socket.IO → connectDB → listen(PORT)
│   ├── app.js                # Express app: helmet, CORS, JSON 10mb, rate limiters, routes, 404, error handler
│   ├── .env.example          # PORT, MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, CLIENT_URL, OLLAMA_* vars
│   ├── config/
│   │   ├── loadEnv.js        # dotenv from backend/.env resolved relative to the file (must be the FIRST import)
│   │   ├── db.js             # mongoose connect (2.5s timeout, bufferCommands=false); isDBConnected()
│   │   └── security.js       # JWT_SECRET / ENCRYPTION_KEY: required in prod, dev fallback with warning
│   ├── models/               # Mongoose schemas: User, Workflow, Execution, Log, Secret, RevokedToken
│   ├── routes/               # authRoutes, workflowRoutes, executionRoutes, secretRoutes, uploadRoutes, copilotRoutes
│   ├── controllers/
│   │   ├── authController.js       # register/login/logout/me + in-memory users & revoked tokens
│   │   ├── workflowController.js   # CRUD workflows + memoryWorkflows
│   │   ├── executionController.js  # run (prepare), list, get by id; wires socket starter/authorizer
│   │   ├── secretController.js     # set/list/delete secrets + getDecryptedUserSecrets()
│   │   ├── uploadController.js     # PDF upload (base64) → text extraction
│   │   ├── copilotController.js    # Chat-with-Qwen: system prompt, schema, guards, autoLayout
│   │   └── aiWorkflowController.js # One-shot generator, SSRF URL sanitizer, fallback templates, normalizer
│   ├── middlewares/
│   │   ├── authMiddleware.js       # authenticateJWT (Bearer token, revocation check, user lookup)
│   │   └── validationMiddleware.js # validateRegister/Login/Workflow/Secret
│   ├── socket/socketServer.js      # Socket.IO server, JWT handshake auth, rooms, emitExecutionEvent()
│   ├── execution/
│   │   ├── executionEngine.js      # prepareExecution, startPendingExecution, executeWorkflow, authorizeExecutionUser
│   │   ├── dagParser.js            # Kahn topological sort, cycle detection, level bucketing
│   │   ├── executionContext.js     # per-run "RAM": outputs, secrets, logs, metrics, vectorStore
│   │   ├── nodeRegistry.js         # type → handler map (plugin registry)
│   │   ├── nodeHandlers/           # one file per node type + index.js registering them
│   │   ├── utils/variableResolver.js  # {{...}} template resolution, findUnresolved()
│   │   ├── utils/rag.js            # chunkText, cosineSim, localEmbed (offline hashed BoW), embedTexts
│   │   └── __tests__/              # vitest unit tests for engine pieces
│   ├── utils/
│   │   ├── ollamaClient.js   # ollamaChat, ollamaEmbed, ollamaWarmup, ollamaStatus, parseJsonResponse
│   │   ├── encryption.js     # AES-256-GCM encryptSecret / decryptSecret
│   │   └── pdfParser.js      # extractPdfText(buffer) using pdf-parse v2 PDFParse
│   ├── __tests__/            # auth, copilot, aiWorkflow tests
│   ├── test_all_nodes.js     # manual script: runs a workflow with all node types (mocked SMTP)
│   └── test_security.js      # manual script: cross-user authorization / socket security checks on port 5199
└── frontend/
    ├── index.html, vite.config.js (dev proxy /api + /socket.io → localhost:5000), tailwind.config.js, postcss.config.js
    ├── public/               # favicon.svg, og-cover.svg, landing images (png)
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── services/api.js   # axios instance baseURL "/api", attaches Bearer token from localStorage "flowforge_token"
        ├── services/socket.js# io(window.location.origin, { autoConnect:false })
        ├── store/            # Zustand: useAuthStore, useWorkflowStore, useExecutionStore, useCopilotStore
        ├── pages/            # AuthPage (+css), DashboardPage, WorkflowBuilderPage
        ├── components/       # Navbar, NodeSidebar, NodeInspector, ExecutionConsole, AICopilotModal, CopilotChatPanel, SecretsModal
        ├── nodes/            # React Flow renderers: BaseNode + one per type, nodeTypes.js map
        └── landing/          # public marketing site (LandingPage, LegalPages, components/*, landing.css)
```

---

## 2. Running it

**Prerequisites:** Node 18+ (22 works), MongoDB (optional in dev), Ollama with models pulled:

```bash
ollama pull qwen3:1.7b
ollama pull qwen3-embedding:0.6b   # optional: without it, Embed/Retrieve use an offline keyword embedding
```

**Environment (`backend/.env`, copy from `.env.example`):**

| Var | Default | Meaning |
|---|---|---|
| `PORT` | 5000 | backend port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/flowforge_db` | Mongo; if unreachable in dev → in-memory mode |
| `JWT_SECRET` | dev fallback | **required in production** |
| `ENCRYPTION_KEY` | dev fallback (64 hex chars = 32 bytes) | AES-256-GCM key; **required in production** |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin for Express + Socket.IO |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server |
| `OLLAMA_MODEL` | `qwen3:1.7b` | chat/generation model |
| `OLLAMA_EMBED_MODEL` | `qwen3-embedding:0.6b` | embedding model |
| `NODE_ENV` | development | `production` makes DB + secrets mandatory |

**Commands:**

```bash
cd backend && npm install && npm run dev      # nodemon server.js  (or: npm start)
cd frontend && npm install && npm run dev     # Vite on 5173, proxies /api and /socket.io to :5000
cd backend && npm test                        # vitest run
```

Root shortcuts: `npm run dev:backend`, `npm run dev:frontend`, `npm run build:frontend`. Windows: double-click `start-windows.bat`.

The frontend always calls same-origin `/api` and `/socket.io`; Vite's proxy forwards them, so it works on any Vite port.

---

## 3. High-level architecture

```
 Browser (React + React Flow + Zustand)
   │  REST (axios, Bearer JWT)            │  Socket.IO (auth: { token })
   ▼                                      ▼
 Express app.js ── routes ── controllers  socketServer.js (rooms "execution:<id>")
   │                    │                      ▲  emitExecutionEvent()
   │                    ▼                      │
   │         executionEngine ── dagParser ── nodeRegistry ── nodeHandlers/*
   │                    │                             │
   ▼                    ▼                             ▼
 MongoDB (or in-memory Maps)                 Ollama (Qwen chat + embeddings), SMTP, external HTTP APIs
```

Note the **dependency inversion** between socket and engine: `executionController.js` calls `registerExecutionStarter(startPendingExecution)` and `registerExecutionAuthorizer(authorizeExecutionUser)` at import time, so `socketServer.js` never imports the engine.

---

## 4. Backend in depth

### 4.1 Boot (`server.js`)
1. `import './config/loadEnv.js'` comes first (ES imports are hoisted; this guarantees env is loaded before `config/security.js` reads it).
2. Create HTTP server from `app`, `initSocketServer(server)`.
3. `connectDB()`: on failure, in production `process.exit(1)`, otherwise warn and run **In-Memory Mode**.
4. `listen(PORT)`.

### 4.2 `app.js` middleware order
`helmet()` → `cors({ origin: CLIENT_URL, credentials })` → `express.json({limit:'10mb'})` → `GET /api/health` (not rate-limited; reports `database: connected|in-memory`) → rate limiters → routes → 404 JSON → error handler (stack only in development).

**Rate limits (per IP, 15-minute window):**
- `authLimiter`: 5 requests, one shared instance mounted on both `/api/auth/register` and `/api/auth/login`.
- `executionLimiter`: 20 requests, `/api/executions/run`.
- `apiLimiter`: 100 requests for everything under `/api` (also counts copilot chat, saves, etc.).

### 4.3 Data models (MongoDB / Mongoose)

| Model | Key fields | Notes |
|---|---|---|
| **User** | `name`, `email` (unique, lowercase), `password` (bcrypt hash), `lastLoginAt` | timestamps |
| **Workflow** | `userId`, `name`, `description`, `nodes: Array`, `edges: Array`, `version` (incremented on each update), `isPublished` (unused) | nodes/edges stored as raw React Flow JSON |
| **Execution** | `workflowId`, `userId`, `status` ∈ pending/running/completed/failed/cancelled, `startedAt`, `completedAt`, `durationMs`, `metrics{tokensUsed,nodesExecuted,retryCount,memoryMB}`, `contextOutputs`, `error` | `cancelled` is never set (no cancel feature) |
| **Log** | `executionId`, `nodeId`, `nodeType`, `level` (info/warn/error/debug), `message`, `outputData`, `durationMs`, `timestamp` | written per node success/failure when DB-backed |
| **Secret** | `userId`, `key`, `encryptedData`, `iv`, `tag` | unique index `(userId,key)` |
| **RevokedToken** | `tokenHash` (SHA-256 of JWT), `expiresAt` (TTL index auto-deletes), `userId` | JWT logout blacklist |

**In-memory fallbacks** (module-level `Map`/`Set`): `memoryUsers` & `memoryRevokedTokens` (authController), `memoryWorkflows` (workflowController), `memorySecrets` (secretController), `memoryExecutions` & `pendingExecutions` (executionEngine). In-memory ids look like `usr_<ts>`, `wf_<ts>`, `exec_<ts>_<seq>`.

### 4.4 Authentication
- `register` validates (name, email regex, password ≥ 6), bcrypt-hashes (salt 10), returns `{ token, user }`. JWT payload `{ userId, email }`, expiry **7 days**, HS256 with `JWT_SECRET`.
- `login` checks the bcrypt hash and updates `lastLoginAt`.
- `logout` stores the SHA-256 of the token in `RevokedToken` (or the memory Set with a timer) until the JWT's `exp`.
- `authenticateJWT` middleware: requires `Authorization: Bearer <jwt>`, rejects revoked hashes, verifies the JWT, and when DB is connected loads the user (`-password`) and returns 401 if the user was deleted. Sets `req.user`.
- Frontend stores the token in `localStorage['flowforge_token']`. `checkAuth()` on app load calls `/auth/me` and clears the token on failure.

### 4.5 REST API reference

All routes except register/login/health need `Authorization: Bearer <token>`. Responses use `{ success: boolean, ... }`.

| Method & path | Body / params | Returns |
|---|---|---|
| `GET /api/health` | none | `{status, service, database, timestamp, uptime}` |
| `POST /api/auth/register` | `{name,email,password}` | `201 {token,user}` |
| `POST /api/auth/login` | `{email,password}` | `{token,user}` |
| `POST /api/auth/logout` | none | revokes the current token |
| `GET /api/auth/me` | none | `{user}` |
| `GET /api/workflows` | none | `{workflows}` sorted by `updatedAt` desc |
| `POST /api/workflows` | `{name,description?,nodes,edges}` (validateWorkflow) | `201 {workflow}` |
| `GET /api/workflows/:id` | none | `{workflow}` (owner only) |
| `PUT /api/workflows/:id` | partial `{name,description,nodes,edges}` | `{workflow}` (`$inc version`) |
| `DELETE /api/workflows/:id` | none | deleted |
| `POST /api/workflows/generate-from-prompt` | `{prompt, autoRun?}` | `{workflow, autoRun, mode: 'live_ai'|'fallback_matcher'}` |
| `POST /api/executions/run` | `{workflowId?, workflowData?: {name,nodes,edges}}` | `202 {executionId, status:'pending'}` |
| `GET /api/executions` | none | last 50 executions (memory + DB merged) |
| `GET /api/executions/:id` | none | `{execution, logs}` |
| `POST /api/secrets` | `{key: /^[A-Z0-9_]+$/i, value}` | upserts, key upper-cased |
| `GET /api/secrets` | none | `{secrets:[{key,createdAt,updatedAt}]}` (values are never returned) |
| `DELETE /api/secrets/:key` | none | deleted |
| `POST /api/upload/pdf` | `{fileName, dataBase64}` (raw base64 or data URL) | `{fileName,text,pageCount,charCount}`; max 8 MB decoded, checks `%PDF-` magic; nothing stored on disk |
| `GET /api/copilot/status` | none | `{online, baseUrl, model, modelInstalled, models[]}` |
| `POST /api/copilot/warmup` | none | `202`; pre-loads the model + system prompt in background (single-flight) |
| `POST /api/copilot/chat` | `{messages:[{role,content}], currentWorkflow?}` | `{action:'ask'|'build', reply, workflow?, model}` or `503` if Ollama is unavailable |

**`/executions/run` semantics:** if `workflowId` is given and owned by the user, it is looked up; if `workflowData` is given (the frontend always sends the current canvas), it **overrides** the saved definition (so unsaved edits run) while keeping the verified `_id`. Client-supplied `_id` is ignored. Nodes/edges are structurally validated, and `parseDAG` runs synchronously so cycles return an HTTP error.

### 4.6 Socket.IO protocol (`socket/socketServer.js`)
- Handshake auth: `socket.handshake.auth.token` (JWT); revocation checked. No query-string tokens.
- Client → server: `join_execution(executionId)` (ownership checked via `authorizeExecutionUser`, then joins room `execution:<id>`), `leave_execution(id)`, `start_execution(id)` (ownership checked, then runs `startPendingExecution`).
- Server → room events (all carry `executionId` and `timestamp`):
  - `workflow.started {workflowId,totalNodes}`
  - `node.started {nodeId,nodeType,nodeLabel}`
  - `node.completed {nodeId,nodeType,output,durationMs}`
  - `node.failed {nodeId,nodeType,error}`
  - `node.skipped {nodeId,nodeType,nodeLabel}`
  - `workflow.completed {workflowId,status,metrics,outputs}`
  - `workflow.failed {error}`
  - `error {message}` sent to the socket only, on unauthorized join/start
- **Why two phases:** the HTTP call only *prepares* (parks in `pendingExecutions`). The client emits `join_execution` and then `start_execution` on the same socket; Socket.IO preserves order, so the client is in the room before the first event fires.

### 4.7 Secrets & encryption
`utils/encryption.js`: AES-256-GCM, random 12-byte IV, auth tag stored; everything hex-encoded. `getDecryptedUserSecrets(userId)` returns `{KEY: plaintext}`, which `executeWorkflow` places on `context.secrets` for `{{secrets.KEY}}` substitution. Decryption failure returns `''`.

---

## 5. The execution engine (`backend/execution/`)

### 5.1 Lifecycle
1. **`prepareExecution(workflow, userId)`**: `parseDAG` (throws on cycle/empty), create an Execution record with status `pending`, park it in `pendingExecutions`.
   - DB record only if DB is connected **and** both `userId` and `workflowId` are valid ObjectIds. Unsaved canvases (`wf_...` ids) therefore always get in-memory `exec_...` records, even with Mongo up.
2. **`startPendingExecution(id)`** is triggered by the socket and calls `executeWorkflow(workflow, userId, prepared)`; unexpected throws are emitted as `workflow.failed`.
3. **`executeWorkflow`**:
   - `parseDAG` gives `levels` (arrays of nodes with no inter-dependency).
   - Load decrypted secrets → `new ExecutionContext(...)`.
   - Flip status to `running`, emit `workflow.started`.
   - For each level: compute skipped nodes (branching), then `Promise.all(runnable.map(runSingleNode))`.
   - If any node in a level failed permanently: stop (later levels never run), mark `failed`, emit `workflow.failed`.
   - Else mark `completed`, persist `contextOutputs` and metrics, emit `workflow.completed` with all outputs.

### 5.2 `dagParser.parseDAG(nodes, edges)`
Kahn's algorithm. Edges referencing unknown nodes are ignored. Throws `'Workflow contains no nodes.'` or `'Circular dependency (cycle) detected in workflow diagram.'`. Returns `{ orderedNodes, sortedNodeIds, levels, hasCycle:false }`. A node's level is `1 + max(level of its sources)`, with roots at 0.

### 5.3 `runSingleNode` (retries & timeouts)
- `maxRetries` = `node.data.maxRetries` (default **1**, which means a single attempt), `retryDelayMs` default 500, `backoffFactor` default 2.0. Delay before attempt *n* = `retryDelayMs * backoff^(n-2)`.
- Per-attempt timeout: `min(node.data.timeoutMs || ceiling, ceiling)` where ceiling = **180 000 ms** for `ollama`/`gemini`/`embed`/`retrieve` and **30 000 ms** for everything else.
- Handler is looked up in `nodeRegistry` by lower-cased `node.type`.
- On success: `context.setNodeOutput(...)`, `nodesExecuted++`; if the output has a `branch` field, record `takenBranch[nodeId]`; write a Log (DB); emit `node.completed`.
- Never throws; returns `{nodeId, success, error}`.

### 5.4 Branching / skip logic
- A Condition node returns `branch: 'true'|'false'`.
- An edge is **dead** if its source was skipped, or its source is a branching node and `edge.sourceHandle || 'true'` ≠ the taken branch.
- A node is **skipped** when it has incoming edges and **all** are dead. Skips cascade downstream. A node with at least one live incoming edge still runs (useful for merging branches).

### 5.5 `ExecutionContext` (per-run memory)
Fields: `executionId, workflowId, userId, secrets, nodeOutputs, variables (always {}; never populated), logs, metrics{startTime,endTime,totalDurationMs,tokensUsed,nodesExecuted,retryCount,memoryMB}, status, error`, plus dynamically `vectorStore` and `vectorStoreMeta` (set by embed).

`setNodeOutput(nodeId, nodeType, nodeLabel, output)` stores the output under **three keys**: the node id, the slugified label (`label.toLowerCase().replace(/[^a-z0-9]/g,'_')`), and the node type. So `{{ollama_1.text}}`, `{{summarize.text}}`, and `{{ollama.text}}` can all work. The type and label aliases are **last-writer-wins**, so with several nodes of one type, `{{ollama.text}}` is ambiguous. Prefer ids.

### 5.6 Template variables (`utils/variableResolver.js`)
Regex: `\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}`.
- `{{secrets.KEY}}` → decrypted secret.
- `{{variables.name}}` → `context.variables` (currently always empty).
- `{{nodeKey}}` → whole output (objects JSON-stringified).
- `{{nodeKey.a.b}}` → nested field (objects stringified).
- **Unresolved placeholders are left as-is** (not an error). `findUnresolved(str)` lists leftovers; the email handler uses it to fail with a helpful message.

### 5.7 Node registry
`nodeRegistry.register(type, fn)` / `getHandler(type)` (throws if unknown). `registerDefaultHandlers()` in `nodeHandlers/index.js` registers the 10 types and `gemini → ollamaHandler`. **Adding a node type = write a handler `async (node, context) => output`, register it, add a React renderer in `frontend/src/nodes`, add it to `nodeTypes.js`, `NodeSidebar` palette, `NodeInspector` fields, `useWorkflowStore.addNode` defaults, and (optionally) the AI prompts/schemas `NODE_TYPES`/`validTypes`.**

---

## 6. Node catalog (exact behavior)

Every handler receives `(node, context)`, reads `node.data`, resolves templates, and returns a plain object (its "output"). Fields listed under "Output" can be referenced as `{{id.field}}`.

| Type | UI name | Inputs (`node.data`) | Output | Behavior notes |
|---|---|---|---|---|
| `text` | Text Input | `text` (or `content`) | `{text, charCount, timestamp}` | Resolves templates in text. Used as input / question. |
| `pdf` | PDF Reader | `text` (extracted by upload), `fileName`, `pageCount` | `{text, fileName, pageCount, charCount, extractedAt}` | **Does not parse at run time.** Text is extracted at upload time (`/api/upload/pdf`) and stored in `node.data.text`, so it is saved inside the workflow document. Falls back to sample text if empty. |
| `ollama` (+`gemini`) | Local AI (Qwen) | `prompt` (or `template`), `system?`, `model?` (Gemini names ignored), `temperature` (0.7) | `{text, model, prompt, tokensUsed, isLocal:true}` | Calls `ollamaChat`. Throws on empty prompt. Adds exact token counts (`prompt_eval_count + eval_count`) to metrics. |
| `api` | REST API | `url`, `method` (GET), `body` (string/object), `headers`, `timeoutMs` (10s) | `{status, statusText, data, durationMs}` | axios. Body is sent only for POST/PUT/PATCH; JSON parsed if possible, and adds `Content-Type: application/json`. Non-2xx throws (fails the node). |
| `condition` | Condition | `leftValue`, `operator`, `rightValue` (templated, compared as strings) | `{result, branch:'true'|'false', left, right, operator, evaluatedAt}` | Operators: `equals, not_equals, contains (default), not_contains, starts_with, ends_with, gt, gte, lt, lte (numeric via parseFloat), is_empty, is_not_empty, is_true, is_false (truthy = true/1/yes/y/on), regex`. Has two output handles `true` / `false`. |
| `delay` | Delay Timer | `delayMs` (1000) | `{delayedMs, completedAt}` | Subject to the 30 s attempt ceiling. |
| `download` | Download File | `text` (or `content`, default `{{ollama.text}}`), `fileName` | `{downloadUrl (data: URL), fileName, content, sizeBytes}` | The actual file save happens in the browser (Execution Console builds a Blob; offers TXT (markdown stripped) and HTML (markdown rendered)). |
| `embed` | Embed & Index | `text` (default `{{pdf.text}}`), `chunkSize` (900), `overlap` (150) | `{chunks, model, isLocal, indexedChars, capped}` | `chunkText` packs paragraphs (overlap clamped to ≤30% of size; huge chunks hard-split), max **60 chunks**. Embeds via Ollama `/api/embed`, falling back to offline 512-dim hashed bag-of-words (`local-tfidf`) with a warning. Pushes `{text, vector}` into `context.vectorStore` and records `vectorStoreMeta`. |
| `retrieve` | Retrieve | `query`, `topK` (4) | `{query, context, matches:[{score,preview}], count, fromChunks}` | Embeds the query in the **same space** as the index (forceLocal or same model, with no silent fallback), ranks by cosine similarity, joins top-K with `\n\n---\n\n` into `context`. Must be downstream of embed (shares the run's context). |
| `email` | Send Email | `to, subject, body (or text), isHtml, from?, smtpHost, smtpPort (587), smtpUser, smtpPass` | `{messageId, accepted, rejected, to, subject, previewUrl, sentAt}` | nodemailer; `secure` iff port 465. Fails with an actionable message if any `{{...}}` remains unresolved (e.g. missing `SMTP_HOST` secret) or required fields are missing. Defaults reference `{{secrets.SMTP_HOST/USER/PASS}}`. |

**Canonical RAG wiring:** `pdf → embed(text={{pdf_1.text}}) → retrieve(query={{text_1.text}})` with `text_1 → retrieve`, then `retrieve → ollama(prompt uses {{retrieve_1.context}} and the question)`.

---

## 7. Ollama / Qwen integration (`backend/utils/ollamaClient.js`)

- **`ollamaChat({messages, model, format, temperature=0.3, numCtx=4096, timeoutMs=180000})`**: `POST {OLLAMA_BASE_URL}/api/chat`, `stream:false`, `keep_alive:'30m'`, `think:false` (if the server rejects `think` with HTTP 400, it retries without it). `format` may be a **JSON schema** (structured outputs). Returns `{text, model, promptTokens, outputTokens}`. Strips `<think>…</think>` blocks (including unclosed ones).
- Friendly errors: offline → "Can't reach Ollama at … run: ollama pull …"; 404 → "Model … is not installed. Run: ollama pull …"; timeout message.
- **`ollamaEmbed(texts, {model})`**: `POST /api/embed` batch; validates the count.
- **`ollamaWarmup(systemPrompt)`**: generates 1 token with the same `num_ctx` so Ollama caches the processed system prompt (reduces first-message latency).
- **`ollamaStatus()`**: `GET /api/tags` (3s timeout) → online, installed models, and whether the configured model is installed (handles `:latest` and registry prefixes).
- **`parseJsonResponse(text)`**: strips think blocks and ``` fences, tries `JSON.parse`, then falls back to the substring between the first `{` and last `}`.

The browser never talks to Ollama directly; Ollama has no auth and must not be exposed publicly.

---

## 8. AI workflow builders

### 8.1 Chat with Qwen (`controllers/copilotController.js`)
Flow for `POST /api/copilot/chat`:
1. Validate messages: non-empty, ≤ 100 messages, each ≤ 4000 chars, roles user/assistant, last must be user.
2. Build model messages: `SYSTEM_PROMPT` (node catalog + 5 few-shot examples; intentionally long because a 1.7B model needs it) + optional system message with `summarizeCanvas(currentWorkflow)` (≤ 30 nodes / 60 edges, strings trimmed to 300 chars, SMTP fields hidden) + the last **12** turns.
3. `ollamaChat` with `format: RESPONSE_SCHEMA` (`{action:'ask'|'build', reply, workflow{name,nodes[{id,type∈NODE_TYPES,data}],edges[{source,target,sourceHandle?}]}}`), temperature 0.2.
4. **Small-model guards:**
   - Unparseable output or empty reply → canned "Sorry, I got confused…" ask.
   - Treated as `ask` if action≠build, there is no workflow, the reply is a pure question (ends with `?` with no built/created/updated… words), or there are no nodes.
   - `normalizeAndValidateWorkflow` (shared with the generator) then `stripRedundantTextSinks` removes useless `text` nodes the model appends after ollama/email or uses as pass-through aliases (rewires edges and rewrites `{{text_x.text}}` references).
   - `checkEmailRecipients`: an email `to` must be an address the user actually typed, one already on the canvas, or a `{{template}}`. Otherwise it is replaced with the user's latest typed address, or the copilot asks `"Which email address should I send it to?"` once; if still none, `to` is left blank and the reply tells the user to fill it in.
   - `autoLayout`: columns by DAG level (x = 100 + col·340), rows centered (spacing 170).
5. Invalid DAG (e.g., cycle) → friendly "rephrase" ask. Ollama errors → HTTP 503 with the fix message.

Frontend (`useCopilotStore`): opening the panel checks `/copilot/status` and, if ready, fires `/copilot/warmup`. It polls status every 5 s while the panel is open and the model isn't ready. It sends only non-local messages (last 12). It does **not** send the canvas if it is still the untouched starter template (`isStarterCanvas`). On `build` it resets execution state and calls `applyGeneratedWorkflow` (canvas replaced, unsaved, `currentWorkflowId=null`). Supports abort/reset via `chatEpoch` + `AbortController`.

### 8.2 One-shot generator (`controllers/aiWorkflowController.js`)
`POST /api/workflows/generate-from-prompt {prompt, autoRun}`: Qwen with its own detailed `SYSTEM_PROMPT` + `WORKFLOW_SCHEMA`, 120 s timeout. On any failure it uses **`generateFallbackWorkflow(prompt)`**, a keyword matcher:
- contains email/alert/notify/condition/check → API → Condition(status==200) → Email (true) / Delay (false)
- pdf/document/doc/rag/embed/search → PDF → Embed → Retrieve → Ollama → Download
- api/fetch/url/http/summarize → API → Ollama → Download
- otherwise → Text → Ollama → Download

**`normalizeAndValidateWorkflow(raw)`** (4 phases): sanitize ids (`[^a-z0-9_]→_`, lowercase), map unknown types to `text` and `gemini` to `ollama`, default positions, per-type defaults (API URL passes through **`sanitizeAndValidateUrl`** SSRF guard that blocks localhost/127.x/10.x/192.168.x/172.16-31.x/169.254.x/::1/fe80 and non-http(s), replacing them with a jsonplaceholder URL; email gets `{{secrets.SMTP_*}}` defaults). Edges are deduped, invalid/self edges dropped, condition handles normalized to `'true'|'false'` and colored green/red. If there are no edges, nodes are chained linearly. Finally `parseDAG` validates.

Frontend `AICopilotModal` has 4 presets (API Summarizer, Document Vector RAG, Conditional Alert, AI Writer), "Generate" and "Generate & Run" (autoRun runs immediately via `runCurrentWorkflow`).

---

## 9. Frontend in depth

### 9.1 Routing (`App.jsx`)
`/` LandingPage, `/privacy`, `/terms`, `/login` AuthPage, `/dashboard` and `/builder` behind `ProtectedRoute` (checks `isAuthenticated`), `*` NotFound. Auth/Dashboard/Builder are lazy-loaded (code-split). `Navbar` and `SecretsModal` render only on app routes.

### 9.2 Zustand stores
- **useAuthStore**: `user, token, isAuthenticated, loading, error`; `login, register, logout, checkAuth, clearError`.
- **useWorkflowStore**: `workflows, currentWorkflowId, workflowName, nodes, edges, selectedNodeId, isSaving, isGeneratingWorkflow, generationError…`. Starter canvas = `text_1 → ollama_1 → download_1`. Actions: `onNodesChange/onEdgesChange` (React Flow `applyNodeChanges`), `updateNodeData(id, patch)`, `addNode(type)` (id `type_<last 4 digits of Date.now()>`, per-type default data), `deleteNode`, `fetchWorkflows`, `loadWorkflow`, `saveWorkflow` (PUT if `currentWorkflowId` else POST), `generateWorkflowFromPrompt`, `applyGeneratedWorkflow`, `resetCanvas`. Exports `isStarterCanvas`.
- **useExecutionStore**: `activeExecutionId, isExecuting, nodeStates{id: running|completed|failed|skipped}, nodeOutputs, logs (newest first), metrics, executionHistory`. `runCurrentWorkflow(workflowData, workflowId)` (re)connects the socket with the token, subscribes to events, POSTs `/executions/run`, then emits `join_execution` + `start_execution`.
- **useCopilotStore**: chat state described in §8.1.

### 9.3 Pages & components
- **DashboardPage**: welcome banner, metric cards (workflow count, execution count; "99.8% reliability" and "6 plugin handlers" are **hard-coded**), saved workflow grid (click to open in builder), "AI Prompt Automator" modal, "Manual Builder".
- **WorkflowBuilderPage**: top bar (editable name, Chat with Qwen, AI Copilot, Save, Run), `NodeSidebar` (click to add 10 node types), `ReactFlow` canvas (Background, Controls, MiniMap; `onConnect` colors condition edges), `NodeInspector` (right), `CopilotChatPanel` (slides over the inspector), `ExecutionConsole` (bottom drawer), `AICopilotModal`.
- **NodeInspector**: per-type forms. PDF upload reads the file as a data URL (≤ 8 MB) → `/upload/pdf` → stores `text, fileName, pageCount, extractedChars` in node data. Ollama model select: `qwen3:1.7b | qwen3:4b | qwen3:8b`. Also the retry policy (maxRetries 1–5, delay).
- **ExecutionConsole**: tabs **Logs**, **Outputs** (one card per real node id; AI outputs first, then sinks, then others, inputs last; TXT/HTML download; raw JSON view), **Observability Metrics** (duration, tokens, nodes executed, retries).
- **SecretsModal**: list/add/delete secrets (keys forced upper-case).
- **nodes/**: `BaseNode` shows status ring/badge from `useExecutionStore.nodeStates`, a left target handle and right source handle(s); `ConditionNode` has `true` (green) / `false` (red) handles. `nodeTypes.js` maps types → components (`gemini → OllamaNode`).

### 9.4 Styling & landing
Tailwind with two isolated color scales: app scale (`brand`, `dark`, `aiv`, `flow`, `run`) and landing-only `lp-*` scale. `index.css` defines `.glass-panel` / `.glass-card` and React Flow overrides. The landing site (`src/landing/`) has Hero, Benefits, Interactive Preview, Tagline Reveal, How It Works, Node Library, Pricing (Community Local $0; Pro/Enterprise prices are literal `{{price}}` placeholders), FAQ, Final CTA, Footer, and Privacy/Terms/404 pages.

---

## 10. End-to-end flows

**Build & run:** add nodes → connect → configure in the inspector (use `{{id.field}}`) → Run → `POST /executions/run` with the canvas → socket join + start → node borders turn running/done/error/skipped live → outputs and metrics appear in the console.

**Save/load:** Save → POST or PUT `/workflows`; Dashboard lists them; clicking one calls `loadWorkflow` and opens the builder.

**Secrets:** Navbar → Secrets → add `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` → email node templates resolve at run time. Gmail: host `smtp.gmail.com`, port 465, app password.

**Chat build:** open "Chat with Qwen" → describe → Qwen asks or builds → canvas replaced (unsaved) → upload a PDF if needed → Run.

---

## 11. Testing

- `backend/__tests__/`: `auth.test.js` (bcrypt, duplicates, lastLoginAt, revocation; uses DB persistence), `copilot.test.js` (ask/build, schema sent, cycles, non-JSON, 503 offline, warmup single-flight, email guard, autoLayout, summarizeCanvas, text-sink stripping), `aiWorkflow.test.js` (SSRF, fallback patterns, normalizer, gemini→ollama, handle normalization).
- `backend/execution/__tests__/`: dagParser, variableResolver, conditionHandler, apiHandler, emailHandler (unresolved secrets), ollamaHandler (mocked fetch, think-flag retry, legacy gemini), rag (embed batch / fallback / same-space), executionEngine (in-memory runs, branch skip, history without CastErrors).
- Manual scripts: `node test_all_nodes.js`, `node test_security.js`.
- No frontend tests.

---

## 12. Conventions & coding style

- Backend is pure ESM JavaScript (no TypeScript), named exports, `async/await`, controllers return `res.status(x).json({success, ...})`.
- Every controller branches on `isDBConnected()` (Mongo vs. memory) and returns 500 "Database service is currently unavailable" in production without a DB.
- Node ids: `type_number` (`ollama_1`) from AI builders; `type_####` from the manual palette.
- Edges are React Flow edges: `{id, source, target, sourceHandle?, targetHandle?, type:'smoothstep', animated:true, style?}`.
- Comments explain *why* (many document small-model quirks and race-condition fixes).

---

## 13. Known gaps, quirks & improvement opportunities (verified in code)

1. **SSRF guard only applies to AI-generated workflows.** `apiHandler` does no host check at run time, so a manually configured API node can call `localhost`/private IPs/cloud metadata.
2. **Ambiguous type/label aliases:** `{{ollama.text}}`, `{{pdf.text}}` (used in several defaults: embed text, email body, download text) resolve to whichever node of that type finished last; parallel nodes make this nondeterministic.
3. **`context.variables` is never populated**, so `{{variables.x}}` never resolves. `metrics.memoryMB` is never computed. `Execution.status='cancelled'` and `Workflow.isPublished` are unused; there is no cancel/stop endpoint.
4. **No triggers/scheduling:** workflows run only when the user clicks Run (no cron, webhook, or event triggers, unlike n8n).
5. **One failed node stops the run** (later levels are skipped); there is no "continue on error" option. Siblings in the same level still finish.
6. **PDF text is stored inside the workflow document**, which can bloat Mongo docs (16 MB BSON limit) and is sent on every run/save.
7. **Unsaved-canvas executions are in-memory only** (lost on restart), even when MongoDB is connected.
8. **`addNode` id collisions** are possible (`Date.now().slice(-4)`).
9. **Dashboard metrics partly hard-coded** ("99.8%", "6 plugin handlers" while there are 10).
10. Inspector shows retry delay default 1000 ms while the engine default is 500 ms.
11. **Auth rate limit is a single shared counter** for register + login (5 per 15 min per IP), which is easy to hit in development.
12. The JWT lives in `localStorage` (XSS-exposed); no refresh tokens.
13. `.env.example` ships working dev secrets; they must be replaced in production (enforced only when `NODE_ENV=production`).
14. `memoryExecutions` / `pendingExecutions` grow without eviction.
15. No frontend tests; no CI config in the repo; no Dockerfile.

---

## 14. Quick glossary

- **DAG**: directed acyclic graph; the workflow shape (no loops allowed).
- **Level**: set of nodes whose dependencies are all in earlier levels; run in parallel.
- **Handle**: React Flow connection point; condition nodes have `true`/`false` source handles.
- **Execution**: one run of a workflow; has an id, status, logs, metrics, outputs.
- **ExecutionContext**: in-memory state of one run (outputs, secrets, vector store).
- **Ollama**: local LLM server; **Qwen** (`qwen3:*`) is the model family used.
- **RAG**: retrieval-augmented generation (embed → retrieve → ollama).
- **In-Memory Mode**: dev fallback when MongoDB is unreachable.

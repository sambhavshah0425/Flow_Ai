# Flow_Ai / FlowForge OS — Complete Project Documentation

> **Purpose of this file.** A single, self-contained reference that lets any engineer or AI assistant understand this codebase *without reading every file first*. It covers what the product does, how the code is organised, how every subsystem works, the exact data contracts between frontend and backend, and the known quirks and bugs.
>
> **How to use it (for an AI).** Read sections 1–4 for orientation, then jump to the subsystem you need. Section 12, *"How to add a new node type"*, is the most common change recipe. Section 13, *"Known issues & gotchas"*, lists traps that are not obvious from the code; read it before changing execution, variables, or the AI generator.
>
> Snapshot date: 2026‑09‑29. Every file in `backend/` and `frontend/src/` was read to produce this document. Backend unit tests pass at this snapshot: **6 files, 55 tests** (`cd backend && npm test`).

---

> **Update 2026-09-29: Qwen Copilot added.** There is now an 11th node type, `ollama` (Local AI via Ollama/Qwen, output `{{id.text}}`, 3-minute timeout), and a conversational copilot: `POST /api/copilot/chat` and `GET /api/copilot/status`, plus the **Chat with Qwen** panel in the builder. See [OLLAMA_QWEN_GUIDE.md](OLLAMA_QWEN_GUIDE.md) for the flow and the full file list. The sections below describe the original 10 node types.

## Table of contents

1. [What the product is](#1-what-the-product-is)
2. [Tech stack](#2-tech-stack)
3. [Repository map (every file)](#3-repository-map-every-file)
4. [Running the project](#4-running-the-project)
5. [High-level architecture](#5-high-level-architecture)
6. [Backend in depth](#6-backend-in-depth)
7. [The execution engine](#7-the-execution-engine)
8. [Node catalog (all 10 node types)](#8-node-catalog-all-10-node-types)
9. [AI workflow generator (prompt → DAG)](#9-ai-workflow-generator-prompt--dag)
10. [Frontend in depth](#10-frontend-in-depth)
11. [End-to-end flows](#11-end-to-end-flows)
12. [How to add a new node type](#12-how-to-add-a-new-node-type)
13. [Known issues, inconsistencies & gotchas](#13-known-issues-inconsistencies--gotchas)
14. [Testing](#14-testing)
15. [Glossary](#15-glossary)

---

## 1. What the product is

**Flow_Ai** (UI brand name: **FlowForge OS**) is a MERN-stack **visual AI workflow orchestrator**, similar in spirit to n8n or Zapier but centred on AI.

A user:

1. Signs up or logs in (JWT auth).
2. Builds a **workflow**: a **DAG** (directed acyclic graph) of **nodes** on a drag-and-drop canvas (`@xyflow/react`). Each node is a task: static text, a Gemini AI call, an HTTP request, PDF text, an embedding or retrieval step (RAG), an IF condition, a delay, a download, or an email.
3. Wires nodes together. Downstream nodes read upstream output with template syntax such as `{{text_1.text}}`, `{{api_1.data.title}}`, or `{{secrets.GEMINI_API_KEY}}`.
4. Clicks **Run**. The backend validates the DAG, runs it level by level (independent nodes in parallel), and **streams live progress over Socket.IO** to a console in the UI.
5. Can instead type a natural-language goal into the **AI Copilot**. The backend asks Gemini to generate the whole DAG as JSON, or falls back to a keyword-based template when there is no API key.
6. Stores API keys and SMTP credentials in an **encrypted Secrets Vault** (AES-256-GCM in MongoDB). Nodes reference them as `{{secrets.KEY}}`.

The public route `/` is a large marketing **landing page** with a scroll-driven **Three.js / React Three Fiber** 3D scene.

**Special behaviour: in-memory mode.** If MongoDB is unreachable **and** `NODE_ENV !== 'production'`, the backend keeps running. Users, workflows, secrets, executions, and revoked tokens live in JavaScript `Map`s and `Set`s, and are lost on restart. Almost every controller has two branches, `if (isDBConnected()) {...} else {...memory...}`.

**Special behaviour: no-key mode.** If there is no Gemini API key, the Gemini node returns a **mock** response, embeddings fall back to a **local hashed bag-of-words** vector, and the AI Copilot uses a **deterministic keyword pattern matcher**. The whole app therefore works without paid services.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js ≥ 18, **ES modules** (`"type": "module"`) |
| HTTP | Express 4, `helmet`, `cors`, `express-rate-limit` |
| DB | MongoDB via Mongoose 8 (optional in dev) |
| Realtime | Socket.IO 4 (server) / `socket.io-client` (browser) |
| Auth | `jsonwebtoken` (7-day tokens), `bcryptjs` (salt rounds 10) |
| Crypto | Node `crypto`, AES-256-GCM for secrets, SHA-256 for token revocation hashes |
| AI | `@google/generative-ai` (Gemini text + embeddings) |
| Integrations | `axios` (API node), `nodemailer` (Email node), `pdf-parse` v2 (PDF upload) |
| Backend tests | Vitest 4 |
| Frontend | React 18, Vite 5, React Router 6 |
| State | Zustand 5 |
| Canvas | `@xyflow/react` 12 (React Flow) |
| Styling | Tailwind CSS 3, PostCSS, custom CSS files |
| Motion / 3D | Framer Motion 12, Lenis (smooth scroll), Three.js 0.185, `@react-three/fiber` 8, `@react-three/drei` 9 |
| Icons | `lucide-react` |

---

## 3. Repository map (every file)

```text
Flow_Ai-updated/
├── README.md                    # Original marketing-style README (some details outdated, see §13)
├── LICENSE                      # MIT
├── package.json                 # Root "workspace" scripts only (no deps): start, dev:backend, dev:frontend, build:frontend
├── package-lock.json
├── .gitignore                   # node_modules, .env, dist, build, *.log, .claude/, scratch/
├── .claude/launch.json          # Dev-server launch configs (frontend-dev :5173, backend-dev :5000)
├── PROJECT_DOCUMENTATION.md     # ← this file
│
├── backend/
│   ├── package.json             # "type":"module"; scripts: start, dev (nodemon), test (vitest run)
│   ├── .env / .env.example      # PORT, MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, GEMINI_API_KEY, CLIENT_URL, NODE_ENV
│   ├── server.js                # Entry: loads env FIRST, creates http server, attaches Socket.IO, connects DB, listens
│   ├── app.js                   # Express app: helmet, CORS, body limits, rate limiters, /api/health, route mounts, 404 + error handler
│   ├── config/
│   │   ├── loadEnv.js           # dotenv loader resolving backend/.env relative to the file (must be first import)
│   │   ├── db.js                # connectDB() (2.5s timeout, bufferCommands=false) + isDBConnected()
│   │   └── security.js          # JWT_SECRET / ENCRYPTION_KEY: required in prod, insecure dev fallback + warning otherwise
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js              # name, email (unique, lowercase), password (bcrypt hash)
│   │   ├── Workflow.js          # userId, name, description, nodes[], edges[], version, isPublished
│   │   ├── Execution.js         # workflowId, userId, status, timing, metrics, contextOutputs, error
│   │   ├── Log.js               # executionId, nodeId, nodeType, level, message, outputData, durationMs
│   │   ├── Secret.js            # userId, key, encryptedData, iv, tag  (unique index userId+key)
│   │   └── RevokedToken.js      # tokenHash (sha256), expiresAt (TTL index), userId
│   ├── routes/                  # Express routers (thin; map URL → controller)
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── workflowRoutes.js    # /api/workflows/* (+ generate-from-prompt)
│   │   ├── executionRoutes.js   # /api/executions/*
│   │   ├── secretRoutes.js      # /api/secrets/*
│   │   └── uploadRoutes.js      # /api/upload/pdf
│   ├── controllers/
│   │   ├── authController.js    # register/login/getProfile/logout + in-memory users & revoked-token Set
│   │   ├── workflowController.js# CRUD + memoryWorkflows Map
│   │   ├── executionController.js # runWorkflow (phase 1), list, get-by-id; wires socket → engine callbacks
│   │   ├── secretController.js  # set/list/delete + getDecryptedUserSecrets() used by the engine
│   │   ├── uploadController.js  # base64 PDF → pdf-parse text (8 MB limit, magic-byte check)
│   │   └── aiWorkflowController.js # Prompt → DAG via Gemini (JSON mode) or fallback matcher; SSRF URL guard; normalizer
│   ├── middlewares/
│   │   ├── authMiddleware.js    # authenticateJWT: Bearer token, revocation check, jwt.verify, attaches req.user
│   │   └── validationMiddleware.js # validateRegister/Login/Workflow/Secret (hand-written checks)
│   ├── socket/
│   │   └── socketServer.js      # Socket.IO init, JWT handshake auth, join/leave/start_execution, emitExecutionEvent()
│   ├── execution/               # ★ The workflow engine
│   │   ├── executionEngine.js   # prepareExecution / startPendingExecution / executeWorkflow / authorizeExecutionUser
│   │   ├── dagParser.js         # Kahn topological sort, cycle detection, parallel "levels"
│   │   ├── executionContext.js  # Per-run RAM: nodeOutputs (+aliases), secrets, variables, logs, metrics
│   │   ├── nodeRegistry.js      # Map<type, handlerFn> plugin registry (singleton)
│   │   ├── nodeHandlers/
│   │   │   ├── index.js         # registerDefaultHandlers(): registers all 10 types
│   │   │   ├── textHandler.js
│   │   │   ├── pdfHandler.js
│   │   │   ├── geminiHandler.js # model fallback chain + per-attempt timeout + mock mode
│   │   │   ├── apiHandler.js
│   │   │   ├── delayHandler.js
│   │   │   ├── downloadHandler.js
│   │   │   ├── conditionHandler.js
│   │   │   ├── embedHandler.js
│   │   │   ├── retrieveHandler.js
│   │   │   └── emailHandler.js  # unresolved-secret guard
│   │   ├── utils/
│   │   │   ├── variableResolver.js # resolveVariables() + findUnresolved()
│   │   │   └── rag.js           # chunkText, cosineSim, localEmbed, embedTexts (Gemini → local fallback)
│   │   └── __tests__/           # Vitest: dagParser, variableResolver, conditionHandler, emailHandler, geminiHandler
│   ├── __tests__/aiWorkflow.test.js # Vitest: SSRF guard, fallback matcher, normalizer
│   ├── utils/
│   │   ├── encryption.js        # encryptSecret / decryptSecret (AES-256-GCM, 12-byte IV)
│   │   └── pdfParser.js         # extractPdfText(buffer) via pdf-parse v2 PDFParse class
│   ├── test_all_nodes.js        # Manual E2E script: runs a 10-node chain via executeWorkflow (mocked SMTP)
│   ├── test_security.js         # Manual integration script: cross-user authz, socket auth, logout revocation (port 5199)
│   └── *.log                    # Empty runtime log files (gitignored)
│
└── frontend/
    ├── package.json             # scripts: dev, build, preview
    ├── index.html               # <html class="dark">, Inter + JetBrains Mono fonts, mounts /src/main.jsx
    ├── vite.config.js           # port 5173, proxies /api → http://localhost:5000 (NOT socket.io)
    ├── tailwind.config.js       # Custom color scales: brand, dark, aiv, flow, run (app) + lp (landing only)
    ├── postcss.config.js
    ├── public/                  # green-metallic-orb.png, lightning-cube.png, security-shield.png (landing art)
    ├── dist/                    # Built output (gitignored)
    └── src/
        ├── main.jsx             # ReactDOM root, StrictMode, imports index.css
        ├── App.jsx              # Router, ProtectedRoute, lazy pages, Navbar + SecretsModal (hidden on "/")
        ├── index.css            # Tailwind layers, .glass-panel/.glass-card, React Flow overrides, scrollbar
        ├── services/
        │   ├── api.js           # axios instance baseURL "/api" + Bearer token interceptor (localStorage)
        │   └── socket.js        # socket.io-client singleton (autoConnect:false)
        ├── store/               # Zustand stores
        │   ├── useAuthStore.js
        │   ├── useWorkflowStore.js
        │   └── useExecutionStore.js
        ├── pages/
        │   ├── AuthPage.jsx + AuthPage.css  # Sliding sign-in / register panel
        │   ├── DashboardPage.jsx            # Stats, saved workflow grid, AI Copilot entry
        │   └── WorkflowBuilderPage.jsx      # Top bar + NodeSidebar + ReactFlow canvas + NodeInspector + ExecutionConsole
        ├── components/
        │   ├── Navbar.jsx              # In-app top nav (hidden when logged out or on "/")
        │   ├── SecretsModal.jsx        # Vault CRUD UI
        │   ├── AICopilotModal.jsx      # Prompt → workflow (+ optional auto-run)
        │   ├── NodeSidebar.jsx         # Palette of 10 node types (click to add)
        │   ├── NodeInspector.jsx       # Per-type config form + PDF upload + retry settings
        │   └── ExecutionConsole.jsx    # Logs / Outputs / Metrics tabs, TXT+HTML download of outputs
        ├── nodes/                      # React Flow custom node renderers
        │   ├── nodeTypes.js            # { text, pdf, gemini, api, delay, download, condition, embed, retrieve, email }
        │   ├── BaseNode.jsx            # Shared shell: status border/badge, handles
        │   └── TextNode, PDFNode, GeminiNode, APINode, DelayNode, DownloadNode, ConditionNode, EmbedNode, RetrieveNode, EmailNode
        └── landing/                    # Public marketing page (isolated styles)
            ├── LandingPage.jsx         # Section composition, Lenis smooth scroll, lazy 3D demo
            ├── landing.css             # .lp-* scoped design layer
            ├── components/             # HeroSection, StackStrip, LiveDemoSection (3D), ProblemSolution, HowItWorks,
            │                           # NodeShowcase, LiveExecution, Security, ProductShowcase, FinalCTA, Navbar, Footer,
            │                           # AmbientBackground, NodeNetwork (SVG fallback), Reveal, Slab, SectionHeading, ClaimProofCard
            └── scene/
                ├── hooks/useSceneBootstrap.js   # WebGL detect, reduced-motion, viewport, quality tier
                ├── store/useSceneStore.js       # Zustand: qualityTier, reducedMotion, webglSupported, viewport
                ├── utils/deviceCapability.js    # detectWebglSupport, detectQualityTier, TIER_CONFIG
                └── system/                      # R3F scene: SystemScene, CentralNode3D, Tube3D (custom shader),
                                                 # InfoCard3D, IconTile3D, Environment3D, SystemCameraRig,
                                                 # systemCameraPath (keyframes), systemData (layout)
```

---

## 4. Running the project

### 4.1 Prerequisites

- Node.js 18+
- MongoDB, local or Atlas. **Optional in development**: without it the backend runs in in-memory mode.

### 4.2 Environment (`backend/.env`)

| Var | Purpose | Default / fallback |
|---|---|---|
| `PORT` | Backend HTTP + Socket.IO port | `5000` |
| `MONGODB_URI` | Mongo connection string | `mongodb://127.0.0.1:27017/flowforge_db` |
| `JWT_SECRET` | JWT signing key | Dev only: hard-coded insecure fallback plus a warning. **Throws in production.** |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes) AES key for secrets | Dev only: `0123…cdef` fallback. **Throws in production.** |
| `GEMINI_API_KEY` | Server-wide Gemini key. A per-user vault secret with the same name takes precedence. | none → mock or fallback modes |
| `CLIENT_URL` | Allowed CORS / Socket.IO origin | `http://localhost:5173` |
| `NODE_ENV` | `production` makes DB and secrets mandatory | — |

`config/loadEnv.js` resolves `.env` relative to its own file, so starting the server from the repo root still loads `backend/.env`. It must be the **first import** in `server.js`, because ES imports are hoisted and `config/security.js` reads `process.env` at import time.

### 4.3 Commands

```bash
# install
npm install                 # root (no real deps)
cd backend && npm install
cd ../frontend && npm install

# run (from repo root)
npm run dev:backend         # nodemon backend/server.js  → http://localhost:5000  (health: /api/health)
npm run dev:frontend        # vite                        → http://localhost:5173

# tests
cd backend && npm test      # vitest run

# manual scripts (from backend/)
node test_all_nodes.js      # runs every node type in one chain, prints PASS/FAIL per node
node test_security.js       # spins a server on :5199 and checks cross-user isolation, socket auth, logout
```

`.claude/launch.json` defines `frontend-dev` (npm run dev:frontend, port 5173) and `backend-dev` (node backend/server.js, port 5000).

### 4.4 Dev networking

- Browser → `http://localhost:5173` (Vite).
- REST: the frontend calls relative `/api/...`, and **Vite proxies `/api` to `:5000`**.
- WebSocket: `services/socket.js` connects **directly to `http://localhost:5000`** when the page origin contains `5173`, otherwise to `window.location.origin`. The Vite proxy does not handle socket.io.

---

## 5. High-level architecture

```text
┌──────────────────────────── Browser (React SPA) ────────────────────────────┐
│  "/"  LandingPage (R3F 3D scene, marketing)                                  │
│  "/login" AuthPage ──► useAuthStore ──► POST /api/auth/login|register        │
│  "/dashboard" DashboardPage ──► GET /api/workflows, GET /api/executions      │
│  "/builder" WorkflowBuilderPage                                              │
│      NodeSidebar ─► useWorkflowStore.addNode                                 │
│      ReactFlow canvas ◄─► useWorkflowStore (nodes, edges)                    │
│      NodeInspector ─► updateNodeData / POST /api/upload/pdf                  │
│      Run ─► useExecutionStore.runCurrentWorkflow                             │
│              1) POST /api/executions/run  → { executionId, status:'pending' }│
│              2) socket.emit('join_execution', id)                            │
│              3) socket.emit('start_execution', id)                           │
│      ExecutionConsole ◄── socket events node.* / workflow.*                  │
│      AICopilotModal ─► POST /api/workflows/generate-from-prompt              │
│  SecretsModal ─► /api/secrets                                                │
└──────────────┬───────────────────────────────────────┬──────────────────────┘
               │ HTTP (JWT Bearer)                     │ Socket.IO (auth.token)
┌──────────────▼───────────────────────────────────────▼──────────────────────┐
│ Express app.js  (helmet, cors, rate limits)          socketServer.js         │
│   routes → controllers                               JWT + revocation check  │
│                                                      rooms "execution:<id>"  │
│   executionController ──► executionEngine.prepareExecution (parks run)       │
│   socket 'start_execution' ──► executionEngine.startPendingExecution         │
│        parseDAG → levels → for each level: Promise.all(runSingleNode)        │
│        nodeRegistry.getHandler(type)(node, ExecutionContext)                 │
│        emitExecutionEvent(...) ──────────────────────────────► browser       │
│   secretController.getDecryptedUserSecrets → context.secrets                 │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ Mongoose (optional)            External: Gemini API, arbitrary HTTP APIs, SMTP
┌──────────────▼──────────┐
│ MongoDB: users, workflows, executions, logs, secrets, revokedtokens │
│ (or in-memory Maps when DB is down in dev)                          │
└─────────────────────────┘
```

**Decoupling detail.** `socketServer.js` does **not** import the engine. `executionController.js`, at import time, calls `registerExecutionStarter(startPendingExecution)` and `registerExecutionAuthorizer(authorizeExecutionUser)`. The socket layer calls those callbacks. The circular-looking dependency is avoided because the engine imports only `emitExecutionEvent` from the socket module.

---

## 6. Backend in depth

### 6.1 Boot sequence (`server.js`)

1. `import './config/loadEnv.js'` loads `.env`.
2. `import { app } from './app.js'`. Importing routes transitively imports `executionController`, which registers the socket callbacks. Importing `executionEngine` calls `registerDefaultHandlers()`, which logs `[NodeRegistry] Registered node handler: "..."` ten times.
3. `http.createServer(app)`, then `initSocketServer(server)`.
4. `await connectDB()`. On failure in production it calls `process.exit(1)`. In development it warns and continues in **In-Memory Mode**.
5. `server.listen(PORT)`.

### 6.2 `app.js`: middleware order

1. `helmet()`
2. `cors({ origin: CLIENT_URL, credentials: true, methods: GET/POST/PUT/DELETE/OPTIONS, allowedHeaders: Content-Type, Authorization })`
3. `express.json({ limit: '10mb' })` and `urlencoded`
4. `GET /api/health` → `{ status:'ok', service, timestamp, uptime }`. Registered before the limiters, so it is not rate-limited.
5. Rate limiters, each with a 15-minute window, returning `{ success:false, message }`:
   - `/api/auth/register` and `/api/auth/login`: **5 requests** (tight; easy to hit while developing)
   - `/api/executions/run`: **20**
   - `/api/*`: **100**
6. Routers: `/api/auth`, `/api/secrets`, `/api/workflows`, `/api/executions`, `/api/upload`
7. 404 JSON handler, then an error handler (includes the stack in development).

**Response convention.** Every endpoint returns JSON containing `success: boolean`, plus `message` on errors.

### 6.3 Data models (MongoDB)

All schemas use `timestamps: true` (adds `createdAt` and `updatedAt`) except `Log`.

**User**
| field | type | notes |
|---|---|---|
| name | String | required, trimmed |
| email | String | required, **unique**, lowercased, trimmed |
| password | String | bcrypt hash, minlength 6 |

**Workflow**
| field | type | notes |
|---|---|---|
| userId | ObjectId → User | required, indexed |
| name | String | default `'Untitled Workflow'` |
| description | String | default `''` |
| nodes | Array | raw React Flow node objects (schemaless) |
| edges | Array | raw React Flow edge objects (schemaless) |
| version | Number | default 1; `$inc` by 1 on every PUT |
| isPublished | Boolean | default false; **unused** |

**Execution**
| field | type | notes |
|---|---|---|
| workflowId | ObjectId → Workflow | **required**; see §13 bug #1 |
| userId | ObjectId → User | required |
| status | enum | `pending | running | completed | failed | cancelled` (`cancelled` is never set) |
| startedAt / completedAt | Date | |
| durationMs | Number | |
| metrics | `{ tokensUsed, nodesExecuted, retryCount, memoryMB }` | `memoryMB` is always 0 |
| contextOutputs | Object | all node outputs (including alias keys) on success |
| error | String | on failure |

**Log**: `executionId`, `nodeId`, `nodeType`, `level` (`info|warn|error|debug`), `message`, `outputData` (Mixed), `durationMs`, `timestamp`. The engine persists only the per-node *success* log and the *permanent failure* log to Mongo. Retry, warning, and skip logs stay in memory.

**Secret**: `userId`, `key` (stored upper-cased), `encryptedData` (hex), `iv` (hex, 12 bytes), `tag` (hex GCM auth tag). Unique compound index on `{userId, key}`.

**RevokedToken**: `tokenHash` (SHA-256 of the raw JWT, unique), `expiresAt` (a **TTL index** with `expires: 0` auto-deletes at the JWT's `exp`), `userId`.

### 6.4 Authentication

- **Register** (`validateRegister`: name non-empty, valid email regex, password ≥ 6) → bcrypt hash → create user → return `{ token, user:{id,name,email} }` (201).
- **Login** (`validateLogin`) → bcrypt compare → `{ token, user }`. Both failure cases return the same `'Invalid credentials.'` (401).
- **Token**: `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })`.
- **`authenticateJWT` middleware**:
  1. Requires `Authorization: Bearer <token>`.
  2. SHA-256 hashes the token and checks the revocation list (Mongo `RevokedToken`, or the in-memory `memoryRevokedTokens` Set).
  3. `jwt.verify`.
  4. Tries `User.findById(decoded.userId).select('-password')`. If that fails or finds nothing (e.g. in-memory mode), it falls back to `req.user = { _id: decoded.userId, email }`.
  - Controllers use `req.user._id || req.user.id` as `userId`.
- **Logout** (`POST /api/auth/logout`) stores the token hash in `RevokedToken`, with expiry from the JWT `exp`. In memory mode it uses the Set plus a `setTimeout` cleanup. **The frontend never calls this endpoint** (see §13).
- **In-memory users** live in `memoryUsers: Map<email, user>` with fake IDs `usr_<timestamp>`.

### 6.5 REST API reference

All routes except register, login, and health require `Authorization: Bearer <jwt>`.

| Method | Path | Body / params | Success response |
|---|---|---|---|
| GET | `/api/health` | — | `{status:'ok', service, timestamp, uptime}` |
| POST | `/api/auth/register` | `{name, email, password}` | 201 `{success, message, token, user:{id,name,email}}` |
| POST | `/api/auth/login` | `{email, password}` | `{success, message, token, user}` |
| POST | `/api/auth/logout` | — | `{success, message}` (revokes the current token) |
| GET | `/api/auth/me` | — | `{success, user}` |
| GET | `/api/workflows` | — | `{success, workflows:[...]}`, sorted by `updatedAt` desc |
| POST | `/api/workflows` | `{name?, description?, nodes?, edges?}` (`validateWorkflow`) | 201 `{success, workflow}` |
| GET | `/api/workflows/:id` | — | `{success, workflow}` or 404 (scoped to owner) |
| PUT | `/api/workflows/:id` | same as POST | `{success, workflow}`; version++. In memory mode an unknown id is **auto-created**. |
| DELETE | `/api/workflows/:id` | — | `{success, message}` |
| POST | `/api/workflows/generate-from-prompt` | `{prompt, autoRun?}` | `{success, workflow:{name,description,nodes,edges,orderedNodes}, autoRun, mode:'live_ai'\|'fallback_matcher'}` |
| POST | `/api/executions/run` | `{workflowId}` **or** `{workflowData:{name,nodes,edges}}` | **202** `{success, executionId, status:'pending'}`. The run does **not** start until the socket `start_execution` event. |
| GET | `/api/executions` | — | `{success, executions}`: last 50, `workflowId` populated with `name` |
| GET | `/api/executions/:id` | — | `{success, execution, logs}` |
| POST | `/api/secrets` | `{key, value}` (`validateSecret`: key `^[A-Z0-9_]+$`i, value non-empty) | `{success, message, secret:{id,key,updatedAt}}` (upsert; key upper-cased) |
| GET | `/api/secrets` | — | `{success, secrets:[{key,createdAt,updatedAt}]}` (**values are never returned**) |
| DELETE | `/api/secrets/:key` | — | `{success, message}` |
| POST | `/api/upload/pdf` | `{fileName, dataBase64}` (raw base64 or `data:` URL) | `{success, fileName, text, pageCount, charCount}` |

**`validateWorkflow` rules**: `name`, if present, must be a non-empty string. `nodes`, if present, must be an array where each item has a string `id`, a string `type`, an optional `position{x:number,y:number}`, and an optional object `data`. `edges`, if present, must be an array where each item has string `id`, `source`, and `target`. `runWorkflow` applies the same checks inline to ad-hoc `workflowData`.

**Ownership.** Every workflow, execution, and secret query filters by `userId`. Another user's resource returns **404** in DB mode, and **404 or 403** in memory mode.

### 6.6 Socket.IO protocol (`socket/socketServer.js`)

**Connection auth.** The client must connect with `io(URL, { auth: { token } })`. Query-string tokens are deliberately **not** accepted. The middleware checks revocation and runs `jwt.verify`, then sets `socket.user = decoded` (`{ userId, email, iat, exp }`). On failure it calls `next(new Error('Authentication error: ...'))`, which the client receives as `connect_error`.

**Client → server events**

| Event | Payload | Behaviour |
|---|---|---|
| `join_execution` | `executionId` | Calls `authorizeExecutionUser(id, socket.user.userId)`. If it returns true, the socket joins room `execution:<id>`. Otherwise it emits `error {message:'Unauthorized access to execution.'}`. |
| `leave_execution` | `executionId` | Leaves the room. |
| `start_execution` | `executionId` | Authorizes, then calls `startPendingExecution(id)`, which runs the parked workflow. |

**Server → client events** (emitted to room `execution:<id>` via `emitExecutionEvent`)

| Event | Payload |
|---|---|
| `workflow.started` | `{executionId, workflowId, totalNodes, timestamp}` |
| `node.started` | `{executionId, nodeId, nodeType, nodeLabel, timestamp}` |
| `node.completed` | `{executionId, nodeId, nodeType, output, durationMs, timestamp}` |
| `node.failed` | `{executionId, nodeId, nodeType, error, timestamp}` |
| `node.skipped` | `{executionId, nodeId, nodeType, nodeLabel, timestamp}` |
| `workflow.completed` | `{executionId, workflowId, status:'completed', metrics, outputs, timestamp}` (`outputs` = all `nodeOutputs`, including alias keys) |
| `workflow.failed` | `{executionId, error, timestamp}` |
| `error` | `{message}` (authorization failures) |

**Why two phases?** If the run started inside the HTTP request, early node events could fire before the browser joined the room. Now the HTTP call only *prepares* the run. Because emits on a single socket are ordered, sending `join_execution` and then `start_execution` guarantees the client is subscribed before the first event.

### 6.7 Secrets & encryption

- `utils/encryption.js`: `encryptSecret(text)` uses `aes-256-gcm` with a random 12-byte IV and returns `{encryptedData, iv, tag}` (hex). `decryptSecret(...)` returns `''` on any failure, such as a wrong key or tampering.
- The key is `Buffer.from(ENCRYPTION_KEY_HEX, 'hex')` and must be 64 hex characters.
- `getDecryptedUserSecrets(userId)` returns a `{ KEY: plaintext }` map. The engine injects it into `ExecutionContext.secrets` at the start of every run. The AI generator also calls it to find a per-user `GEMINI_API_KEY`.
- **Resolution order for the Gemini key**, used by the Gemini, Embed, Retrieve, and AI generator paths: `context.secrets.GEMINI_API_KEY` (user vault) → `process.env.GEMINI_API_KEY`.

### 6.8 PDF upload (`uploadController.js` + `utils/pdfParser.js`)

1. The browser reads the file with `FileReader.readAsDataURL` and POSTs `{fileName, dataBase64}`.
2. The server strips any `data:...;base64,` prefix and decodes to a Buffer.
3. It validates the file: non-empty, **≤ 8 MB** decoded (the JSON limit is 10 MB because base64 inflates ~33%), and magic bytes `%PDF-`.
4. `extractPdfText`: `new PDFParse({data: buffer}).getText()` → `{text, pageCount}`. It always calls `parser.destroy()`.
5. It returns `{text, pageCount, charCount}`. **No file is stored.** The frontend writes `text`, `fileName`, `pageCount`, and `extractedChars` into the PDF node's `data`. At run time the `pdf` handler just re-emits `data.text`.

---

## 7. The execution engine

Files: `backend/execution/*`.

### 7.1 Lifecycle

```text
POST /api/executions/run
  └─ executionController.runWorkflow
       ├─ resolve workflow: by workflowId (owner-scoped) OR ad-hoc workflowData (validated)
       └─ prepareExecution(workflow, userId)
            ├─ parseDAG(nodes, edges)            ← throws on empty/cycle → HTTP 500 with message
            ├─ createExecutionRecord(..., 'pending')
            │     DB connected && userId is 24 chars → Execution.create(...) → id = Mongo _id
            │     else → id = `exec_<Date.now()>`, stored in memoryExecutions Map
            └─ pendingExecutions.set(id, { workflow, userId, dbExecutionRecord, workflowId })
  ← 202 { executionId, status:'pending' }

socket 'start_execution'(id)  → authorize → startPendingExecution(id)
  └─ executeWorkflow(workflow, userId, prepared)
       1. parseDAG → { orderedNodes, levels }
       2. secrets = getDecryptedUserSecrets(userId)
       3. mark record 'running'
       4. context = new ExecutionContext(executionId, workflowId, userId, secrets)
       5. emit workflow.started
       6. for each level (in order):
            - skip nodes whose incoming edges are ALL "dead" → emit node.skipped
            - Promise.all(runnable.map(runSingleNode))   ← parallel within level
            - if any failed → stop (later levels never run)
       7. finish: update DB/memory record; emit workflow.completed | workflow.failed
```

`executeWorkflow(workflow, userId)` can also be called **directly without `prepared`**. In that case it creates its own record with status `running`. `test_all_nodes.js` uses this path, with `userId = null`, so no secrets are loaded.

### 7.2 DAG parsing (`dagParser.js`)

- Throws `'Workflow contains no nodes.'` when `nodes` is empty.
- Builds the adjacency list and in-degrees. **Edges that reference unknown node IDs are silently ignored.**
- Runs **Kahn's algorithm** for a topological order. If the sorted count is less than the node count, it throws `'Circular dependency (cycle) detected in workflow diagram.'` Self-loops count as cycles.
- **Levels**: `level(node) = 1 + max(level(sources))`, with roots at 0. It returns `levels: Node[][]`. Nodes in the same level have no dependency on each other and run concurrently.
- Returns `{ orderedNodes, sortedNodeIds, levels, hasCycle:false }`.

### 7.3 `runSingleNode(node)`: retries & timeouts

| Setting (from `node.data`) | Default | Meaning |
|---|---|---|
| `maxRetries` | **1** | **Total attempts**, not extra retries. `1` means a single try. |
| `retryDelayMs` | 500 | Delay before attempt 2. |
| `backoffFactor` | 2.0 | Delay for attempt *n* = `retryDelayMs × backoff^(n-2)`. |
| `timeoutMs` | 30000 | Per-attempt timeout, **capped at 30 000 ms** (`HARD_ATTEMPT_TIMEOUT_MS`). |

Flow: emit `node.started` → loop attempts. For each attempt: `handler = nodeRegistry.getHandler(type)`, then `await runWithTimeout(handler(node, context), ms)`. On success it calls `context.setNodeOutput(...)`, increments `metrics.nodesExecuted`, records `takenBranch[nodeId] = output.branch` if present, persists a success `Log`, and emits `node.completed`. On final failure it persists an error `Log` and emits `node.failed`. It never throws. It returns `{nodeId, success, error?}`.

The node `type` is lower-cased; a missing type defaults to `'text'`. An unknown type throws `No handler registered for node type: "..."`, which counts as a node failure.

### 7.4 Branching (Condition node) & skipping

- The condition handler returns `branch: 'true' | 'false'`.
- An edge is **dead** when (a) its source node was skipped, or (b) its source recorded a `takenBranch` and `edge.sourceHandle || 'true'` differs from that branch. An edge with no `sourceHandle` leaving a condition node is treated as the `'true'` edge.
- A node is **skipped** when it has ≥ 1 incoming edge and **all** of them are dead. Skipping propagates: a skipped node makes its outgoing edges dead.
- Skipped nodes produce no output and do not fail the workflow.
- Because a node needs **all** incoming edges dead to be skipped, a merge node fed by both branches still runs.

### 7.5 `ExecutionContext` (per-run RAM)

```js
{
  executionId, workflowId, userId,
  secrets: { KEY: 'plaintext' },
  nodeOutputs: {},       // see aliasing below
  variables: {},         // exists for {{variables.x}} but NOTHING ever populates it
  logs: [],              // every addLog() entry
  metrics: { startTime, endTime, totalDurationMs, tokensUsed, nodesExecuted, retryCount, memoryMB },
  status, error,
  vectorStore?: [{ text, vector }],        // added by embed handler
  vectorStoreMeta?: { model, isLocal }     // so retrieve embeds the query in the same space
}
```

**Output aliasing.** `setNodeOutput(nodeId, nodeType, nodeLabel, output)` stores the same output under **three keys**:

1. `nodeId`, e.g. `gemini_1`
2. the slugified label: `label.toLowerCase().replace(/[^a-z0-9]/g,'_')`, so `"Gemini AI"` → `gemini_ai`
3. the node type, e.g. `gemini`

So `{{gemini_1.text}}`, `{{gemini_ai.text}}`, and `{{gemini.text}}` can all resolve to the same value. When several nodes share a type or label, **the last one to finish wins** the alias. With parallel levels that order is nondeterministic, so prefer node IDs.

### 7.6 Variable resolution (`utils/variableResolver.js`)

`resolveVariables(templateStr, context)` replaces every `{{ path }}`, where `path` matches `[a-zA-Z0-9_.-]+` and surrounding whitespace is allowed.

| Syntax | Resolves to |
|---|---|
| `{{secrets.KEY}}` | `context.secrets.KEY` |
| `{{variables.name}}` | `context.variables.name` (always empty today) |
| `{{nodeKey}}` | the whole output: `JSON.stringify` for objects, `String()` otherwise |
| `{{nodeKey.a.b.c}}` | nested field; objects are JSON-stringified |

Rules:

- Non-string input is returned unchanged.
- **Unresolved references are left as literal `{{...}}` text.** This is deliberate so prompts degrade gracefully.
- `findUnresolved(value)` lists the remaining references. The Email handler uses it to fail with a clear message instead of passing `{{secrets.SMTP_HOST}}` to DNS.
- Resolution happens **inside each handler** on the fields that handler chooses. It is not applied generically to all of `node.data`.

### 7.7 Node registry (`nodeRegistry.js`)

A singleton `NodeRegistry` holds a `Map<lowercaseType, async (node, context) => output>`, with `register(type, fn)`, `getHandler(type)` (throws if missing), and `getRegisteredTypes()`. `nodeHandlers/index.js#registerDefaultHandlers()` registers all 10 types when `executionEngine.js` is imported.

### 7.8 Persistence summary

| Situation | Execution record | Logs |
|---|---|---|
| DB connected, 24-char userId, `Execution.create` OK | Mongo doc; status pending → running → completed/failed; `contextOutputs` on success | Mongo `Log` for each node success/failure |
| DB not connected (dev) | `memoryExecutions` Map entry, with `logs = context.logs` attached at the end | in memory |
| DB connected but `Execution.create` throws | **Nowhere** (see §13 bug #1) | none |

---

## 8. Node catalog (all 10 node types)

Every node has the React Flow shape `{ id, type, position:{x,y}, data:{ label, ...typeFields, maxRetries?, retryDelayMs?, backoffFactor?, timeoutMs? } }`.

"Resolved" means the field goes through `resolveVariables`.

### 8.1 `text`: Text Input
- **data**: `text` or `content` (resolved; default `''`)
- **output**: `{ text, charCount, timestamp }`
- **Canvas**: `TextNode`, blue, `Type` icon.

### 8.2 `pdf`: PDF Reader
- **data**: `text` or `content` (resolved), `fileName`, `pageCount`. Text is filled by `POST /api/upload/pdf` from the Inspector, or typed manually. Default text: `'Sample PDF Document Content\nChapter 1: ...'`.
- **output**: `{ text, fileName, pageCount, charCount, extractedAt }`
- The handler does **not** parse PDFs. Parsing happens only at upload time.

### 8.3 `gemini`: Gemini AI
- **data**: `prompt` or `template` (resolved; default `'Summarize the input data.'`), `model` (default `gemini-flash-latest`), `temperature` (default 0.7), `geminiTimeoutMs` (optional per-attempt timeout).
- **Key**: vault `GEMINI_API_KEY`, then env.
- **No key → mock**: returns a canned text beginning `[Gemini AI Response (Mock Mode - ...)]`, with `isMock:true` and `tokensUsed:150`.
- **With key**: tries `[selectedModel, ...FALLBACK_MODELS]`, where `FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite']`, de-duplicated.
  - Per-attempt timeout = `min(geminiTimeoutMs || 11000, floor(28000 / chainLength))`, so the whole chain fits inside the engine's 30 s node timeout.
  - It moves to the next model only for "fallbackable" errors (message contains 503, overloaded, 429, quota, rate limit, 500, 404, not found, network, fetch failed, ETIMEDOUT, ECONNRESET, did not respond, …). A 400, 401, or 403 fails immediately.
  - It logs `Calling model "X"` before each call and a warning on fallback.
- **output**: `{ text, model (actual), requestedModel, fallbackUsed, triedModels, prompt, isMock:false, tokensUsed }`. Tokens are estimated as `ceil((prompt.length + text.length) / 4)` and added to `metrics.tokensUsed`.
- **Inspector model options**: `gemini-flash-latest`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`.

### 8.4 `api`: REST API
- **data**: `url` (resolved; default `https://jsonplaceholder.typicode.com/posts/1`), `method` (default GET), `body` (string or object; resolved; JSON-parsed if possible; sent only for POST/PUT/PATCH), `headers` (object; default `{Content-Type: application/json}`; **not resolved**), `timeoutMs` (axios timeout, default 10000).
- **output**: `{ status, statusText, data, durationMs }`. Non-2xx responses throw (axios default), which counts as a node failure.
- **The Inspector only exposes `method` and `url`.** Body and headers can only be set by the AI generator or by editing the JSON.
- The runtime handler has **no SSRF protection**. Only AI-generated URLs are sanitised (see §9).

### 8.5 `condition`: Condition (IF)
- **data**: `leftValue` (or `left`), `operator` (default `contains`), `rightValue` (or `right`). Both operands are resolved and compared **as strings**.
- **Operators**: `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `gt`, `gte`, `lt`, `lte` (numeric via `parseFloat`; non-numeric → false), `is_empty`, `is_not_empty`, `is_true`, `is_false` (truthy set: `true, 1, yes, y, on`), `regex` (`new RegExp(right).test(left)`; an invalid pattern → false). Unknown operator → false.
- **output**: `{ result, branch:'true'|'false', left, right, operator, evaluatedAt }`
- **Canvas**: two source handles, id `true` (green, 62% down) and id `false` (rose, 82% down). The builder colours connected edges (`#34d399` or `#f43f5e`).

### 8.6 `delay`: Delay Timer
- **data**: `delayMs` (default 1000)
- **output**: `{ delayedMs, completedAt }`
- A delay over ~30 s will hit the engine's hard timeout.

### 8.7 `download`: Download File
- **data**: `text` or `content` (resolved; default `'{{gemini.text}}'`), `fileName` (default `result.txt`)
- **output**: `{ downloadUrl: 'data:text/plain;charset=utf-8,<encoded>', fileName, content, sizeBytes }`
- Nothing downloads automatically. The **Outputs** tab of `ExecutionConsole` shows **TXT** (markdown stripped to plain text) and **HTML** (markdown rendered into a styled HTML document) buttons for any output with a `fileName`.

### 8.8 `embed`: Embed & Index
- **data**: `text` or `content` (resolved; default `'{{pdf.text}}'`), `chunkSize` (default 900), `overlap` (default 150, clamped to ≤ 30% of `chunkSize`)
- **Process**: `chunkText` packs paragraphs up to `chunkSize` with tail overlap and hard-splits oversized chunks. It keeps at most **60 chunks** and logs a warning when it caps. `embedTexts` tries Gemini models `gemini-embedding-001`, `gemini-embedding-2`, and `gemini-embedding-2-preview` (one `embedContent` call per chunk), then falls back to **`localEmbed`**: a 512-dimension hashed term-frequency vector with stopwords removed and L2 normalisation.
- **Side effect**: pushes `{text, vector}` into `context.vectorStore` and sets `context.vectorStoreMeta = {model, isLocal}`. The store lives **only for that run**.
- **output**: `{ chunks (count), model, isLocal, indexedChars, capped }`

### 8.9 `retrieve`: Retrieve (semantic search)
- **data**: `query` (resolved), `topK` (default 4)
- Embeds the query **in the same space** as the indexed chunks (`forceLocal: meta.isLocal`, same model), ranks by cosine similarity, and takes the top K.
- **output**: `{ query, context (top chunks joined by '\n\n---\n\n'), matches:[{score, preview}], count, fromChunks }`. With an empty query or empty store it returns `context:''` plus a `note`.
- Use it as **`{{retrieve_1.context}}`** in a Gemini prompt. There is **no `.text` field**; see §13.

### 8.10 `email`: Send Email
- **data**: `to`, `subject` (default `(no subject)`), `body` or `text`, `isHtml`, `smtpHost`, `smtpPort` (default 587), `smtpUser`, `smtpPass`, `from` (default = user). All fields are resolved. The defaults from `addNode` and the AI generator use `{{secrets.SMTP_HOST}}`, `{{secrets.SMTP_USER}}`, and `{{secrets.SMTP_PASS}}`.
- Guard: if any of Host, User, Password, To, or From still contains `{{...}}` after resolution, it throws one error that lists **every** missing key and suggests adding them to the Secrets Vault (Gmail hint: `smtp.gmail.com`, port 465).
- `secure: port === 465` (implicit TLS); otherwise STARTTLS.
- **output**: `{ messageId, accepted, rejected, to, subject, previewUrl (Ethereal only), sentAt }`

---

## 9. AI workflow generator (prompt → DAG)

File: `backend/controllers/aiWorkflowController.js`. Route: `POST /api/workflows/generate-from-prompt`.

1. Validate that `prompt` is a non-empty string.
2. Look up a Gemini key (user vault, then env).
3. **With a key**: call `gemini-flash-latest` with `responseMimeType: 'application/json'`, `temperature 0.2`, and `systemInstruction = SYSTEM_PROMPT`. The system prompt describes all 10 node schemas, the `{{id.field}}` rules, horizontal layout coordinates, and the strict JSON output schema. The user goal is wrapped in `<user_goal>…</user_goal>`. The call races a **6-second timeout**. On **any** error (timeout, bad JSON, validation) it falls back.
4. **Without a key, or after an error**: `generateFallbackWorkflow(prompt)` does keyword matching, checked in this order:
   1. `email|alert|notify|condition|check` → **Alert router**: `api_1` → `condition_1` (`{{api_1.status}} equals 200`) → true: `email_1`, false: `delay_1`
   2. `pdf|document|doc|rag|embed|search` → **RAG**: `pdf_1` → `embed_1` → `retrieve_1` → `gemini_1` → `download_1`
   3. `api|fetch|url|http|summarize` → **API summariser**: `api_1` → `gemini_1` → `download_1`
   4. otherwise → **Default**: `text_1` (the prompt) → `gemini_1` → `download_1`
5. `normalizeAndValidateWorkflow(raw)` runs in four phases:
   - Name trimmed to 80 characters, description to 300.
   - **Nodes**: ids lower-cased with non-`[a-z0-9_]` replaced by `_`. Unknown types become `text`. Missing positions become `x = 100 + idx*350, y = 150`. Missing labels become `"<TYPE> Node"`. Per-type defaults: api → `sanitizeAndValidateUrl` and uppercase method; gemini → default model and prompt; condition → operator and operands; download → fileName and text; email → SMTP secret placeholders.
   - **Edges**: kept only if both endpoints exist and are distinct. Duplicate `source->target` pairs are dropped. Edges leaving a condition get `sourceHandle` (default `'true'`) and a colour style.
   - If there are no edges but there are several nodes, it **auto-chains them linearly**.
   - Finally it runs `parseDAG` (throws on a cycle) and returns `{name, description, nodes, edges, orderedNodes}`.
6. Response: `{ success, workflow, autoRun, mode }`. `mode` is `live_ai` whenever a key existed, **even if the fallback was actually used**.

**`sanitizeAndValidateUrl` (SSRF guard)**: `{{...}}` template URLs are allowed through. Non-http(s) or unparsable URLs are replaced with the jsonplaceholder URL. Hosts matching localhost, 127.*, 0.0.0.0, 10.*, 192.168.*, 172.16–31.*, 169.254.*, ::1, or fe80:: are replaced the same way. **This guard runs only in the generator, not in `apiHandler`.**

---

## 10. Frontend in depth

### 10.1 Entry & routing (`main.jsx`, `App.jsx`)

- `BrowserRouter` → `AppShell`. On mount it calls `useAuthStore.checkAuth()`.
- Routes:
  - `/` → `LandingPage` (eager import; hides the in-app `Navbar` and `SecretsModal`)
  - `/login` → `AuthPage` (lazy)
  - `/dashboard` → `ProtectedRoute(DashboardPage)` (lazy)
  - `/builder` → `ProtectedRoute(WorkflowBuilderPage)` (lazy)
  - `*` → redirect to `/dashboard`
- `ProtectedRoute` redirects to `/login` when `isAuthenticated` is false. `isAuthenticated` starts as `!!localStorage.flowforge_token`.
- The pages are code-split so the landing page does not load React Flow.

### 10.2 Services

- `services/api.js`: `axios.create({ baseURL: '/api' })`. A request interceptor adds `Authorization: Bearer ${localStorage.flowforge_token}`. There is **no response interceptor** (no global 401 handling).
- `services/socket.js`: a singleton `io(URL, { autoConnect:false, reconnection:true })`. `URL` is `http://localhost:5000` if the origin contains `5173`, else the page origin. The token is set as `socket.auth = { token }` right before connecting (in `useExecutionStore`).

### 10.3 Zustand stores

**`useAuthStore`**
| state | notes |
|---|---|
| `user, token, isAuthenticated, loading, error` | `token` is initialised from localStorage key **`flowforge_token`** |

| action | behaviour |
|---|---|
| `login(email, password)` | POST `/auth/login`, stores the token, returns a boolean |
| `register(name, email, password)` | POST `/auth/register` |
| `logout()` | removes the token locally only; **no API call** |
| `checkAuth()` | GET `/auth/me`; on failure clears the token |
| `clearError()` | |

**`useWorkflowStore`**
| state | notes |
|---|---|
| `workflows` | list from the API |
| `currentWorkflowId` | `null` means an unsaved canvas, so the next save uses POST |
| `workflowName` | edited inline in the builder via `useWorkflowStore.setState` |
| `nodes, edges` | React Flow arrays; the default canvas is `text_1 → gemini_1 → download_1` |
| `selectedNodeId` | drives `NodeInspector` |
| `isSaving, isGeneratingWorkflow, generationError, loadingWorkflows, error` | |

Actions:

- `setNodes`, `setEdges`, `onNodesChange` and `onEdgesChange` (use `applyNodeChanges` and `applyEdgeChanges`), `setSelectedNodeId`, `updateNodeData(id, partial)`.
- `addNode(type, position={250,250})`: the id is `${type}_${last 4 digits of Date.now()}`. It seeds per-type default data (see `§8`) and selects the new node.
- `deleteNode(id)`: also removes edges touching the node.
- `fetchWorkflows()`, `loadWorkflow(wf)`, `saveWorkflow()` (PUT if `currentWorkflowId`, else POST, then stores `_id`), `resetCanvas()`.
- `generateWorkflowFromPrompt(prompt, autoRun)`: replaces the canvas with the generated DAG and sets `currentWorkflowId = null`.

**`useExecutionStore`**
| state | notes |
|---|---|
| `activeExecutionId, isExecuting` | |
| `nodeStates` | `{ nodeId: 'running'|'completed'|'failed'|'skipped' }`; missing means idle. Read by `BaseNode` for borders and badges. |
| `nodeOutputs` | per node; **replaced** by `workflow.completed.outputs`, which include alias keys |
| `logs` | **newest first** (prepended) |
| `metrics, executionHistory, loadingHistory` | |

Actions:

- `runCurrentWorkflow(workflowData)`:
  1. reset
  2. (re)connect the socket with the current token
  3. `subscribeToSocketEvents()`
  4. POST `/executions/run { workflowData }` (**always ad-hoc**, never `workflowId`)
  5. emit `join_execution`, then `start_execution`
- `subscribeToSocketEvents()`: calls `off` and then `on` for `node.started`, `node.completed`, `node.failed`, `node.skipped`, `workflow.completed`, `workflow.failed`, and `connect_error`. It does **not** listen for `workflow.started` or `error`.
- `fetchExecutionHistory()`: GET `/executions`.

### 10.4 Pages

- **AuthPage**: a sliding panel (`.fa-*` classes in `AuthPage.css`) toggling between Sign In (email, password) and Register (first name, last name, email, password; first and last name are joined into `name`). On success it shows a banner, then navigates to `/dashboard` after 600 ms. A shared show/hide-password toggle is provided.
- **DashboardPage**: a banner with **AI Prompt Automator** (opens `AICopilotModal`) and **Manual Builder** (`resetCanvas` → `/builder`). It shows four stat cards: workflow count, execution count, a **hard-coded "99.8%"** reliability figure, and a **hard-coded "6"** plugin handlers figure (there are actually 10). Below that is a grid of saved workflows; clicking one calls `loadWorkflow` and goes to `/builder`.
- **WorkflowBuilderPage**: a full-height layout.
  - **Top bar**: back button, editable workflow name, **AI Copilot**, **Save Workflow**, **Run Workflow**.
  - **Body**: `NodeSidebar` | `ReactFlow` (`Background`, `Controls`, `MiniMap`, `fitView`, custom `nodeTypes`) | `NodeInspector`.
  - **Bottom**: `ExecutionConsole`.
  - `onConnect` adds an animated `smoothstep` edge, coloured by branch handle. Clicking a node selects it; clicking the pane clears the selection.

### 10.5 Components

- **Navbar**: renders only when authenticated. It shows the logo, Dashboard and Workflow Studio links, the Secrets Vault button, the user name and email, and logout.
- **SecretsModal**: loads `/secrets` when opened. The form upper-cases the key and uses a password-type value input. It lists key names with delete buttons; values are never shown.
- **AICopilotModal**: a prompt textarea, 4 preset prompts (API Summarizer, Document Vector RAG, Conditional Alert Pipeline, Autonomous AI Writer), **Generate Workflow**, and **⚡ Generate & Auto-Run**. Auto-run calls `runCurrentWorkflow` with the generated nodes and edges immediately. `onWorkflowReady` lets the Dashboard navigate to `/builder`.
- **NodeSidebar**: a static `NODE_PALETTE` of 10 entries. Clicking one calls `addNode(type)`. Drag-and-drop from the palette is **not** implemented; nodes are added by click at (250, 250).
- **NodeInspector**: when nothing is selected, it shows a placeholder. Otherwise it shows the node id (read-only), a label field, per-type fields, and a shared **"Exponential Retry Backoff"** section (`maxRetries` 1–5 and `retryDelayMs`). The PDF upload control enforces 8 MB and PDF MIME type client-side.

  Fields exposed per type:
  | type | fields |
  |---|---|
  | text | text |
  | pdf | upload + editable extracted text |
  | gemini | model select, prompt, temperature slider |
  | api | method, url |
  | email | to, subject, body, isHtml, SMTP host/port/user/pass |
  | embed | text, chunkSize |
  | retrieve | query, topK |
  | condition | leftValue, operator (15 options), rightValue (hidden for unary operators) |
  | delay | delayMs |
  | download | fileName, text |

- **ExecutionConsole**: a collapsible bottom drawer.
  - The header shows an "Executing…" pill or a "Complete (Nms)" pill.
  - **Logs** tab: timestamp, level badge, nodeId, message.
  - **Outputs** tab: one `OutputCard` per *real* node id (alias keys filtered out). Each shows a preview text (`text`, then `content`, then JSON), a raw-JSON toggle, and TXT/HTML download buttons for outputs that have a `fileName`.
  - **Metrics** tab: duration, tokens, nodes executed, retries.
  - It includes small helpers: a markdown-to-plain-text converter, a markdown-to-HTML converter, and `buildHtmlDoc`.

### 10.6 Canvas node renderers (`src/nodes/`)

`BaseNode({ id, data, icon, title, colorClass, children, sourceHandles })` renders:

- a 256 px card with a left **target** handle;
- a header with the icon, `data.label || title`, and a status badge (Running spinner, Done, Error, or Skipped at 45% opacity with a dashed border);
- the body (`children`);
- one right **source** handle, or several when `sourceHandles` is passed (used by Condition).

Each `XNode.jsx` is a thin preview wrapper:

| component | preview |
|---|---|
| APINode | method badge + URL |
| GeminiNode | model + prompt (display default model `gemini-3.1-flash-lite`) |
| PDFNode | filename, page count, first 90 characters |
| ConditionNode | `left op right` + True/False legend |
| EmbedNode | `index: <text>` |
| RetrieveNode | query + `top K → {{retrieve.context}}` |
| EmailNode | to / re |
| DelayNode | `⏱ Delay Nms` |
| DownloadNode | `💾 filename` |
| TextNode | text |

`nodeTypes.js` maps type strings to components. **The keys must match the backend registry types.**

### 10.7 Styling system

- `index.html` sets `<html class="dark">`. Tailwind `darkMode: 'class'`. Fonts: Inter (sans) and JetBrains Mono (mono).
- **App colour scales** (`tailwind.config.js`):
  - `brand` (blue, `#3b82f6` primary)
  - `dark` (950 `#070a10` … 600): layered dark surfaces
  - `aiv` (violet; AI)
  - `flow` (cyan; edges)
  - `run` (green; execution)
- **Landing scale** `lp` (emerald `#10b981`, grounds `#060c18` / `#030712`): used **only** under `src/landing/**`, so landing restyles cannot affect the app.
- Custom animations: `pulse-slow`, `spin-slow`, `blob-a`, `blob-b`, `run-dot`. Custom easing: `expo`.
- `index.css`: `.glass-panel` and `.glass-card` (blur + translucent), React Flow overrides (rounded nodes, blue 10 px handles, grey edges, blue selected edge), and a thin dark scrollbar.
- `AuthPage.css`: `.fa-*` classes for the auth page's sliding two-panel animation.
- `landing.css`: `.lp-*` classes, all scoped under `.lp-root` (slabs, cards, pills, CTA bar, numerals, stats, tabs, reduced-motion handling).

### 10.8 Landing page (`src/landing/`)

- `LandingPage.jsx` calls `useSceneBootstrap()` and sets up **Lenis** smooth scrolling (a `requestAnimationFrame` loop). An `IntersectionObserver` with a 300 px margin lazy-loads `LiveDemoSection` (the 3D chunk).
  - QA hook: the URL param `?lpy=<px>` disables Lenis, pins the scroll position, and forces the demo to load (for screenshot tooling).
- **Section order**: `AmbientBackground`, `LandingNavbar`, `HeroSection`, `StackStrip`, `LiveDemoSection` (270 vh sticky, not wrapped in a slab), then `<Slab>`-wrapped sections: `ProblemSolutionSection`, `HowItWorksSection`, `NodeShowcaseSection` (paper tone), `LiveExecutionSection`, `SecuritySection`, `ProductShowcaseSection`, `FinalCTASection`. `LandingFooter` closes the page. The CTAs link to `/login`.
- Helpers: `Reveal`, `RevealGroup`, and `revealItem` (Framer Motion fade/slide-in, reduced-motion aware); `Slab` (rounded panel that overlaps the previous section); `SectionHeading` (split or centred masthead); `ClaimProofCard`; `NodeNetwork` (animated SVG graph, also the **non-WebGL fallback**). Images come from `/public`: `green-metallic-orb.png` (Hero, FinalCTA), `lightning-cube.png` (LiveExecution), `security-shield.png` (Security).
- **3D scene** (`scene/`):
  - `useSceneBootstrap`: detects WebGL, subscribes to `prefers-reduced-motion`, tracks the viewport, and sets `qualityTier` (`high` / `medium` / `low` from core count, device memory, mobile viewport, and coarse pointer). `TIER_CONFIG` defines particle count, DPR, and shadows per tier. `Environment3D` currently always uses its default of 140 particles.
  - `LiveDemoSection`: maps scroll through the 270 vh wrapper to `progress` 0→1 (eased 0.12 per frame) and adds cursor parallax. It renders an R3F `<Canvas>` with fog, lights, `SystemScene`, and `SystemCameraRig`, plus a 3-step indicator (Core Engine / Connecting Nodes / Full System Live). Without WebGL it renders `NodeNetwork`.
  - `systemData.js`: 4 `INFO_CARDS` (Frontend Portal, Vector DB Store, Agent API Gateway, Email Notification) and 14 `ICON_TILES` in two rows, with tube pathways from the hub rim to each item.
  - `SystemScene`: reveals items sequentially. The hub establishes over 0–0.08, each item fades in over an overlapping 0.16 window across 0.08–0.78, and everything is energised after 0.78.
  - `CentralNode3D` (layered cylinders, emissive ring, extruded double-chevron mark), `Tube3D` (Catmull-Rom elbow path, vertex-displaced ribbed `TubeGeometry`, and an `onBeforeCompile` shader injection for the scroll-reveal `discard` and a travelling emissive "charge"), `InfoCard3D` and `IconTile3D` (drei `RoundedBox` + `Html` overlays with lucide icons, floating bob), `Environment3D` (ground plane, `ContactShadows`, rotating `Points` particles).
  - `SystemCameraRig` + `systemCameraPath.js`: keyframed camera poses with smoothstep interpolation and exponential damping; the camera holds its final pose from 0.78 onward.

---

## 11. End-to-end flows

### 11.1 Build & run a workflow

1. User opens `/builder`. The store holds the default 3-node canvas, or a loaded workflow.
2. User adds nodes (sidebar click), connects handles (`onConnect` → `setEdges`), and edits fields (`NodeInspector` → `updateNodeData`).
3. **Run** → `runCurrentWorkflow({ name, nodes, edges })`.
4. The socket connects with `auth.token` and the listeners attach.
5. `POST /api/executions/run { workflowData }` validates, parses the DAG, and creates a pending record. The response is `202 { executionId }`.
6. `emit('join_execution', id)` → authorised → joins room. `emit('start_execution', id)` → run begins.
7. Events stream in. Nodes turn blue (running), then green (done), red (failed), or dashed (skipped). The console fills with logs.
8. `workflow.completed` sets `metrics` and `nodeOutputs`, and the Outputs tab shows results with download buttons.

### 11.2 Save / load

- **Save** → PUT `/workflows/:id` if `currentWorkflowId` is set, else POST `/workflows`, then the store records `_id`.
- The Dashboard lists workflows; clicking one loads it and navigates to the builder.

### 11.3 AI Copilot

- Prompt → POST `/workflows/generate-from-prompt` → the canvas is replaced (unsaved).
- With **Auto-Run**, the modal immediately calls `runCurrentWorkflow` with the generated graph.

### 11.4 PDF RAG example (the correct wiring)

```text
pdf_1 (upload a PDF in the Inspector; data.text now holds the extracted text)
  → embed_1   data.text  = "{{pdf_1.text}}"
  → retrieve_1 data.query = "What are the payment terms?"
  → gemini_1  data.prompt = "Answer using only this context:\n{{retrieve_1.context}}\n\nQ: What are the payment terms?"
  → download_1 data.text  = "{{gemini_1.text}}", fileName "answer.txt"
```

### 11.5 Secrets

- Navbar → **Secrets Vault** → add `GEMINI_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and so on.
- Values are encrypted at rest. At run time they are decrypted into `context.secrets`. Nodes reference them as `{{secrets.NAME}}`.
- A vault `GEMINI_API_KEY` is picked up automatically by the Gemini, Embed, Retrieve, and Copilot paths; no template is needed.

### 11.6 Example workflow JSON (the shape the API stores and executes)

```json
{
  "name": "Summarize API post",
  "nodes": [
    { "id": "api_1", "type": "api", "position": { "x": 100, "y": 150 },
      "data": { "label": "Fetch post", "url": "https://jsonplaceholder.typicode.com/posts/1", "method": "GET" } },
    { "id": "gemini_1", "type": "gemini", "position": { "x": 450, "y": 150 },
      "data": { "label": "Summarize", "prompt": "Summarize: {{api_1.data.body}}", "model": "gemini-flash-latest", "temperature": 0.5, "maxRetries": 2 } },
    { "id": "cond_1", "type": "condition", "position": { "x": 800, "y": 150 },
      "data": { "label": "Long?", "leftValue": "{{gemini_1.text}}", "operator": "contains", "rightValue": "important" } },
    { "id": "email_1", "type": "email", "position": { "x": 1150, "y": 50 },
      "data": { "label": "Alert", "to": "me@example.com", "subject": "Important post", "body": "{{gemini_1.text}}",
                "smtpHost": "{{secrets.SMTP_HOST}}", "smtpPort": 465, "smtpUser": "{{secrets.SMTP_USER}}", "smtpPass": "{{secrets.SMTP_PASS}}" } },
    { "id": "download_1", "type": "download", "position": { "x": 1150, "y": 250 },
      "data": { "label": "Save", "fileName": "summary.txt", "text": "{{gemini_1.text}}" } }
  ],
  "edges": [
    { "id": "e1", "source": "api_1", "target": "gemini_1", "type": "smoothstep", "animated": true },
    { "id": "e2", "source": "gemini_1", "target": "cond_1", "type": "smoothstep", "animated": true },
    { "id": "e3", "source": "cond_1", "sourceHandle": "true",  "target": "email_1",    "type": "smoothstep", "animated": true },
    { "id": "e4", "source": "cond_1", "sourceHandle": "false", "target": "download_1", "type": "smoothstep", "animated": true }
  ]
}
```

---

## 12. How to add a new node type

Say the new type is `slack`.

1. **Backend handler**: create `backend/execution/nodeHandlers/slackHandler.js`:
   ```js
   import { resolveVariables, findUnresolved } from '../utils/variableResolver.js';
   export async function slackHandler(node, context) {
     const d = node.data || {};
     const text = resolveVariables(String(d.text ?? ''), context);
     // ... do work; throw on failure (engine handles retries/timeouts)
     return { text, sentAt: new Date().toISOString() };   // becomes {{node_id.field}} outputs
   }
   ```
   - Resolve every user-facing string field with `resolveVariables`.
   - For credentials, use `findUnresolved` to produce clear errors.
   - Keep each call well under 30 s (the engine's hard cap per attempt).
   - Add token estimates to `context.metrics.tokensUsed` if relevant. Use `context.addLog(node.id, type, level, msg)` for extra log lines.
   - To make it a **branching** node, return `branch: '<handleId>'` and give edges matching `sourceHandle` values.
2. **Register it**: add `nodeRegistry.register('slack', slackHandler)` in `nodeHandlers/index.js`.
3. **AI generator** (`aiWorkflowController.js`): add it to `SYSTEM_PROMPT` (schema and output reference), to the `validTypes` Set in `normalizeAndValidateWorkflow` (otherwise it is coerced to `text`), and to any per-type defaults.
4. **Frontend renderer**: create `frontend/src/nodes/SlackNode.jsx` using `BaseNode`, then add `slack: SlackNode` in `nodes/nodeTypes.js`.
5. **Palette**: add an entry to `NODE_PALETTE` in `components/NodeSidebar.jsx`.
6. **Defaults**: add `...(nodeType === 'slack' && {...})` in `useWorkflowStore.addNode`.
7. **Inspector form**: add a `{type === 'slack' && (...)}` block in `components/NodeInspector.jsx`.
8. **Tests**: add `backend/execution/__tests__/slackHandler.test.js` (Vitest; mock external SDKs with `vi.mock`, as in `emailHandler.test.js` and `geminiHandler.test.js`).
9. Optionally update the landing `systemData.js`, `NodeShowcaseSection`, and the Dashboard "Plugin Handlers" count.

---

## 13. Known issues, inconsistencies & gotchas

These come from reading the code at this snapshot. Bug #1 was partly verified by running the Mongoose validator. Treat the rest as findings to confirm before relying on them.

### Bugs

1. **Runs from the builder likely never start when MongoDB is connected.** The builder always posts ad-hoc `workflowData` with no `_id`. `prepareExecution` therefore uses `workflowId = 'wf_<timestamp>'`. `Execution.workflowId` is a required ObjectId, so `Execution.create` fails with a `CastError` (verified with `validateSync`). The `catch` sets `executionId = 'exec_<ts>'` but **does not add it to `memoryExecutions`**. Next, `authorizeExecutionUser` (DB branch) calls `Execution.findById('exec_...')`, which fails casting and returns `false`. `join_execution` and `start_execution` both emit `error`, and the frontend does not listen for `error`, so the UI stays on "Executing…". In-memory mode works fine. Possible fixes: send `workflowId` for saved workflows; make `Execution.workflowId` optional or a String; always store fallback records in `memoryExecutions`; and let `authorizeExecutionUser` also check `pendingExecutions` when the DB is connected.
2. **The RAG fallback template references a field that does not exist.** `generateFallbackWorkflow` wires the Gemini prompt with `{{retrieve_1.text}}`, and `SYSTEM_PROMPT` documents the retrieve outputs as `.text` and `.results`. The handler actually returns **`context`** and **`matches`**, so the placeholder stays literal. It should be `{{retrieve_1.context}}`.
3. **Logout does not revoke the token.** `Navbar` calls `useAuthStore.logout()`, which only clears localStorage. `POST /api/auth/logout` exists but is never called, so the JWT stays valid until it expires (7 days).
4. **No UI handling of socket `error` or `workflow.started`.** Authorization failures leave `isExecuting = true` forever.
5. **The AI normalizer lower-cases node IDs but not `{{Id.field}}` references inside `data`.** If Gemini emits mixed-case IDs, the templates break.
6. **`mode: 'live_ai'` is returned whenever a key exists**, even when the fallback matcher was actually used.

### Security

7. **SSRF protection applies only to AI-generated API URLs.** A user-built API node can call `http://localhost`, `169.254.169.254`, and similar addresses from the server.
8. The dev fallback `JWT_SECRET` and `ENCRYPTION_KEY` are public in the repo. They are allowed only when `NODE_ENV !== 'production'`.
9. The auth rate limit is 5 requests per 15 minutes per IP for register and login combined, which is easy to exhaust while testing.

### Behavioural gotchas

10. **`maxRetries` means total attempts** (default 1, i.e. no retry). The Inspector labels it "Max Retries", and its `retryDelayMs` displays a default of 1000 while the engine's default is 500.
11. **The alias keys** (label slug and type) collide across nodes of the same type; the last finisher wins. Defaults such as `{{gemini.text}}` (download and email) and `{{pdf.text}}` (embed) rely on these aliases.
12. `{{variables.*}}` is supported by the resolver but **nothing populates `context.variables`**.
13. **Unresolved `{{...}}` are left verbatim** and are not errors, except in the Email node.
14. **The vector store is per-execution.** Embed and Retrieve must be in the same run, with Embed upstream of Retrieve.
15. The engine's 30 s hard per-attempt timeout applies to Delay nodes too.
16. **API node `headers` are not variable-resolved**, and the Inspector cannot edit `body` or `headers`.
17. The `pdf` handler never parses a PDF; it returns `data.text`. Without an upload it emits placeholder sample text.
18. Frontend node IDs use the last 4 digits of `Date.now()`, so collisions are possible, though unlikely.
19. `GeminiNode` displays a default model of `gemini-3.1-flash-lite`, while the handler and Inspector default to `gemini-flash-latest`.
20. There is no global 401 interceptor on the frontend. An expired token is only cleared by `checkAuth` on app load.

### Stale or cosmetic

21. The Dashboard stats "99.8% reliability" and "6 plugin handlers" are hard-coded; the real handler count is 10.
22. The README lists condition operators as `==, !=, >, <`; the real operator names are listed in §8.5. The README also says "Gemini Pro" and describes the Download node as a "file stream".
23. `index.html` references `/favicon.svg`, which does not exist in `public/`.
24. `Workflow.isPublished`, `Execution.status: 'cancelled'`, and `metrics.memoryMB` are never used.
25. There are unused imports in `DashboardPage` (`Play`, `Trash2`, `Wand2`) and `NodeInspector` (`HelpCircle`, `Layers`).
26. The project folder is currently **not a git repository**. `frontend/dist/` holds a stale build.

---

## 14. Testing

**Automated (Vitest)**: `cd backend && npm test`. At this snapshot: 6 files, 55 tests, all passing.

| File | Covers |
|---|---|
| `execution/__tests__/dagParser.test.js` | linear, diamond, and isolated ordering; 2-node, self-loop, and 3-node cycles; empty or undefined nodes; ghost edges |
| `execution/__tests__/variableResolver.test.js` | secrets, variables, and node domains; nested paths; unresolved placeholders left intact; multiple placeholders |
| `execution/__tests__/conditionHandler.test.js` | all operator families; invalid regex is safe; template operands |
| `execution/__tests__/emailHandler.test.js` | unresolved-secret guard names **all** missing keys; sends when resolved; literal values accepted (nodemailer mocked) |
| `execution/__tests__/geminiHandler.test.js` | a hung model doesn't consume the budget; fallback on 503; fail fast on 401; mock mode without a key (SDK mocked) |
| `__tests__/aiWorkflow.test.js` | SSRF guard allow/block lists; the 4 fallback templates; normalizer coordinates, cycle error, empty error |

**Manual scripts** (run with `node`, from `backend/`):

- `test_all_nodes.js` monkey-patches `nodemailer.createTransport`, runs a 10-node linear chain through `executeWorkflow(workflow, null)`, and prints a PASS/FAIL matrix and all logs. It makes real network calls to jsonplaceholder, and to Gemini if a key is set.
- `test_security.js` starts the app on port 5199, registers users A and B, and checks that B can't read, update, or delete A's workflow or read A's execution. It also checks ad-hoc validation (400s), socket rejection without or with a bad token, that B can't join A's execution room, and that a revoked token gets 401 after logout. When Mongo is connected it deletes `test-*@flowforge.com` users and **all** `RevokedToken` docs.

There are **no frontend tests**.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Workflow** | A saved graph `{name, description, nodes[], edges[]}` owned by a user |
| **Node** | A task in the graph; `type` selects the backend handler and the frontend renderer |
| **Edge** | A directed link `source → target`; `sourceHandle` selects a Condition branch (`'true'`/`'false'`) |
| **DAG** | Directed acyclic graph. Cycles are rejected. |
| **Level** | A group of nodes at the same dependency depth; they run in parallel |
| **Execution** | A single run of a workflow (a record, streamed events, and logs) |
| **ExecutionContext** | Per-run in-memory state: outputs, secrets, logs, metrics, vector store |
| **Handler** | `async (node, context) => output` registered in `nodeRegistry` |
| **Template / variable** | A `{{...}}` placeholder resolved at run time |
| **Alias** | An extra `nodeOutputs` key (label slug or type) pointing at a node's output |
| **Secrets Vault** | Per-user AES-256-GCM-encrypted key/value store, referenced as `{{secrets.KEY}}` |
| **In-memory mode** | Dev-only operation without MongoDB, using JS `Map`s |
| **Mock / fallback mode** | Operation without a Gemini key (canned AI text, local embeddings, keyword-matched Copilot) |
| **Two-phase run** | HTTP prepare (`pending`), then socket `start_execution`, so no events are missed |
| **Copilot** | The prompt-to-workflow generator (`/workflows/generate-from-prompt`) |

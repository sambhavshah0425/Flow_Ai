# 🌌 Flow_Ai (FlowForge OS)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://mongodb.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan.svg)](https://react.dev)
[![XYFlow](https://img.shields.io/badge/Canvas-XYFlow%2FReact-orange.svg)](https://reactflow.dev)

**Flow_Ai** (internally styled as *FlowForge OS*) is an **Agentic Workflow Orchestrator** built on the MERN stack with local AI execution via [Ollama](https://ollama.com). It lets users design, generate, inspect, and execute Directed Acyclic Graph (DAG) workflows combining local Qwen AI, RAG search, HTTP APIs, conditional branching, email delivery, and file downloads.

Featuring a sleek **SaaS landing page & interactive preview**, an **XYFlow drag-and-drop workflow studio**, an integrated **Chat with Qwen Copilot**, MongoDB-persisted authentication, and a **real-time Socket.IO execution console**, Flow_Ai runs completely locally with zero cloud AI keys required.

---

## 🌟 Key Features

*   **Visual Workflow Builder**: Design and wire custom nodes on a zoomable, drag-and-drop canvas powered by `@xyflow/react`, complete with a per-node property inspector, retry policy settings, and PDF text extraction uploads.
*   **Conversational Chat with Qwen & AI Copilot**: Describe automations in plain English inside the studio chat panel (`Chat with Qwen`) or single-prompt generator (`AI Copilot`). Powered locally by Ollama (`qwen3:1.7b`), with JSON-schema enforcement, warmup prompt caching, email recipient safety guards, and automatic left-to-right layout.
*   **Local AI Execution Engine**: Run workflows step-by-step across topological DAG levels using local Qwen (`ollama` and legacy `gemini` node alias), REST API requests, PDF extraction, semantic chunking/retrieval (`qwen3-embedding:0.6b` or offline `local-tfidf` fallback), and `{{node_id.field}}` variable interpolation.
*   **Branching & Control Flow**: Route execution paths dynamically with **Condition Nodes** (`equals`, `contains`, numeric comparisons, regex, etc.) and skip inactive branches automatically, or pause flows with **Delay Nodes**.
*   **Real-Time Execution Streaming**: Stream `node.started`, `node.completed`, `node.failed`, `node.skipped`, and final outputs/metrics live to the console via `Socket.io` — supporting both saved MongoDB workflows and unsaved canvas runs.
*   **MongoDB Auth & Encrypted Secrets Vault**: Register and log in with `bcryptjs`-hashed passwords stored in MongoDB (`lastLoginAt` tracking and server-side token revocation on logout), and store API keys or SMTP credentials in MongoDB encrypted with AES-256-GCM.
*   **SaaS Marketing Site & Legal Routes**: Code-split landing page (`/`) featuring an interactive node preview, node library catalog, pricing/FAQ sections, plus `/privacy` and `/terms` pages.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18, Vite (code-split ES modules)
*   **Styling & Motion**: Tailwind CSS, Framer Motion, Lenis smooth scroll, Lucide & Phosphor Icons
*   **Workflow Canvas**: `@xyflow/react`
*   **State Management**: Zustand
*   **Real-time Connection & HTTP**: `socket.io-client`, Axios
*   **Routing**: React Router DOM v6

### Backend
*   **Runtime**: Node.js (ES module syntax)
*   **Framework**: Express 4
*   **Database**: MongoDB & Mongoose ORM (with local in-memory fallback for unsaved canvas runs / local dev)
*   **WebSockets**: `socket.io` (authenticated real-time execution rooms)
*   **Local AI Integration**: [Ollama](https://ollama.com) running Qwen locally (`qwen3:1.7b` for chat/generation, optional `qwen3-embedding:0.6b` for vector search)
*   **Security**: `bcryptjs`, JWT authentication + `RevokedToken` logout blacklist, Helmet, Express Rate Limiter, AES-256-GCM secret encryption
*   **Utilities**: `pdf-parse` (PDF text extraction), Axios (API requests), Nodemailer (SMTP email)

---

## 📁 Repository Structure

```text
Flow_Ai/
├── backend/                  # Express REST API & DAG Execution Engine
│   ├── __tests__/            # API & controller tests (auth, copilot, aiWorkflow)
│   ├── config/               # Database & security configurations
│   ├── controllers/          # Business logic (Auth, Workflows, Executions, Copilot, Secrets, Upload)
│   ├── execution/            # Core DAG parser, execution context, and runner
│   │   ├── __tests__/        # Engine, DAG parser, RAG & node handler unit tests
│   │   ├── nodeHandlers/     # Processors (text, pdf, api, condition, embed, retrieve, ollama, email, delay, download)
│   │   └── utils/            # Variable resolver & RAG embedding/chunking helper
│   ├── middlewares/          # JWT + revocation guards & request validators
│   ├── models/               # Mongoose schemas (User, Workflow, Execution, Log, Secret, RevokedToken)
│   ├── routes/               # Express route definitions
│   ├── socket/               # Authenticated Socket.io server & execution room handshake
│   ├── utils/                # Ollama HTTP client & AES-256-GCM encryption helper
│   ├── server.js             # API & Socket.io entrypoint
│   └── .env.example          # Sample environment variables
│
├── frontend/                 # React SPA Client
│   ├── public/               # Favicon & social preview assets
│   ├── src/
│   │   ├── components/       # UI panels (CopilotChatPanel, ExecutionConsole, NodeInspector, SecretsModal, etc.)
│   │   ├── landing/          # SaaS landing page, sections, interactive preview & legal pages
│   │   ├── nodes/            # Custom XYFlow canvas node components
│   │   ├── pages/            # Routes (DashboardPage, WorkflowBuilderPage, AuthPage)
│   │   ├── services/         # Axios API client & Socket.io client
│   │   └── store/            # Zustand stores (auth, workflow canvas, execution, copilot)
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js        # Vite config with /api and /socket.io proxy to port 5000
│
├── OLLAMA_QWEN_GUIDE.md      # Local Qwen (Ollama) architecture & troubleshooting guide
├── start-windows.bat         # One-click Windows local starter script
├── package.json              # Workspace root scripts
└── .gitignore                # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/en) (v18.x or higher)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) (local on `127.0.0.1:27017` or MongoDB Atlas URI)
*   [Ollama](https://ollama.com) (for local Qwen AI chat & workflow execution)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sambhavshah0425/Flow_Ai.git
   cd Flow_Ai
   ```

2. **Configure Backend Environment**
   Navigate to the `backend` directory, create a `.env` file from `.env.example`, and set your secrets:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Example `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/flowforge_db
   JWT_SECRET=your_jwt_secret_here
   ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   CLIENT_URL=http://localhost:5173
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:1.7b
   OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b
   NODE_ENV=development
   ```

3. **Pull Local Qwen Model(s) via Ollama**
   ```bash
   ollama pull qwen3:1.7b            # required for Local AI node & Chat with Qwen / Copilot
   ollama pull qwen3-embedding:0.6b  # optional for Embed & Retrieve neural search (falls back to offline TF-IDF)
   ```
   See [OLLAMA_QWEN_GUIDE.md](OLLAMA_QWEN_GUIDE.md) for tuning, warmup, and troubleshooting details.

4. **Install Dependencies**
   ```bash
   # In root directory
   npm install

   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

---

## 💻 Running the Application

Make sure **MongoDB** (`27017`) and **Ollama** (`ollama serve` on `11434`) are running, then start the backend and frontend from the project root:

### Start Backend Development Server
```bash
npm run dev:backend
# API & Socket.IO server runs on http://localhost:5000
```

### Start Frontend Development Server
```bash
npm run dev:frontend
# Client dev server runs on http://localhost:5173
```

### Windows: One-Click Start
Double-click **`start-windows.bat`** in the project root. It installs missing packages, starts the backend and frontend servers in separate windows, and opens the app in your browser.

---

## 🧩 Supported Node Catalog

| Node Type | Inputs | Outputs | Description |
| :--- | :--- | :--- | :--- |
| **Text Node** (`text`) | Static text / `{{var}}` template | `text`, `charCount` | Provides static prompts, questions, or interpolated text constants. |
| **PDF Extractor** (`pdf`) | PDF upload (`.pdf`) or text | `text`, `fileName`, `pageCount`, `charCount` | Extracts text from uploaded PDF documents via `POST /api/upload/pdf` or uses pasted text. |
| **API Request** (`api`) | URL, method, headers, body | `data`, `status`, `statusText`, `durationMs` | Executes HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) using Axios. |
| **Local AI (Qwen)** (`ollama` / legacy `gemini`) | Prompt, optional system prompt, model, temperature | `text`, `model`, `tokensUsed` | Runs prompts locally through Ollama (`qwen3:1.7b` by default) and records real token usage. |
| **Embed Node** (`embed`) | Text input, chunk size | `chunks`, `model`, `isLocal`, `indexedChars` | Splits text into overlapping chunks and indexes vectors via Ollama or offline `local-tfidf`. |
| **Retrieve Node** (`retrieve`) | Query, `topK` | `context`, `matches`, `count` | Ranks indexed chunks by cosine similarity and returns top-K context for downstream AI prompts. |
| **Condition Node** (`condition`) | Left value, operator, right value | `result`, `branch` (`true` / `false`) | Evaluates comparisons (`equals`, `contains`, `gt`, `lt`, `regex`, etc.) and routes or skips branches. |
| **Delay Node** (`delay`) | Duration (`delayMs`) | `delayedMs`, `completedAt` | Pauses downstream branch execution for the configured duration. |
| **Email Node** (`email`) | To, subject, body, SMTP fields | `messageId`, `accepted`, `sentAt` | Sends plain text or HTML emails via Nodemailer using credentials stored in the Secrets Vault (`{{secrets.SMTP_*}}`). |
| **Download Node** (`download`) | Source text / `{{var}}`, `fileName` | `downloadUrl`, `fileName`, `content`, `sizeBytes` | Generates downloadable `.txt` / `.html` output artifacts directly from the Execution Console. |

---

## 🔗 Variable Resolution Syntax

Reference any upstream node output, encrypted secret, or workflow variable using `{{...}}` syntax inside node fields:

```text
{{node_id.output_field}}
{{secrets.SECRET_KEY}}
```

### Example:
1. **Text Node** (`text_1`): `Summarize the benefits of local AI workflows.`
2. **Local AI Node** (`ollama_1`): `{{text_1.text}}`
3. **Download Node** (`download_1`): `{{ollama_1.text}}`

---

## 🧪 Testing & Build

Run the backend test suite (11 Vitest suites / 90 tests covering auth, copilot guards, workflow normalization, DAG validation, variable resolution, node handlers, and execution authorization):
```bash
npm --prefix backend test
```

Build the production frontend bundle:
```bash
npm run build:frontend
```

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

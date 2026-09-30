# 🌌 Flow_Ai (FlowForge OS)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://mongodb.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan.svg)](https://react.dev)
[![XYFlow](https://img.shields.io/badge/Canvas-XYFlow%2FReact-orange.svg)](https://reactflow.dev)

**Flow_Ai** (internally styled as *FlowForge OS*) is an advanced, production-grade **Agentic Workflow Orchestrator** built on the MERN stack. It empowers developers and users to build, visualise, and run complex Directed Acyclic Graph (DAG) workflows integrated with AI models, data retrievers, branching conditions, and custom integrations.

Featuring a **3D-rendered interactive landing page**, a sleek **drag-and-drop editor canvas**, and a **real-time log & execution terminal**, Flow_Ai delivers a stunning user experience combined with robust, securely executed workflow automation.

---

## 🌟 Key Features

*   **Visual Workflow Builder**: Seamlessly design workflows by placing, connecting, and configuring custom nodes on a zoomable, drag-and-drop graph canvas powered by `@xyflow/react`.
*   **AI-Powered Execution Engine**: Dynamically run workflows step-by-step. Orchestrate tasks using **Qwen running locally through Ollama** (free, private, no API key), format prompts, extract PDF texts, compute vector embeddings, and interface with external REST APIs.
*   **Variable Interpolation**: Reference outputs of upstream nodes using intuitive syntax, e.g. `{{node_id.output_field}}`, resolving data dynamically at runtime.
*   **Branching & Control Flow**: Control execution paths using **Condition Nodes** (IF/ELSE) and throttle speeds using **Delay Nodes**.
*   **Secure Secret Vault**: Safely store system API keys, SMTP credentials, and user tokens in MongoDB using secure AES-256-GCM encryption.
*   **Real-time Streaming**: Watch your workflows execute live with step-by-step progress bars and console logs streamed to the frontend via WebSockets (`Socket.io`).
*   **Immersive 3D Experience**: A stunning, hardware-accelerated landing page containing an interactive 3D node graph environment built with **Three.js / React Three Fiber (R3F)**.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18, Vite (TypeScript-ready ES modules)
*   **Styling**: Tailwind CSS, Vanilla CSS, Framer Motion (micro-animations)
*   **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
*   **State Management**: Zustand
*   **Workflow Canvas**: `@xyflow/react`
*   **Real-time Connection**: `socket.io-client`
*   **Routing**: React Router DOM v6
*   **Smooth Scroll**: Lenis

### Backend
*   **Runtime**: Node.js (ES module syntax)
*   **Framework**: Express
*   **Database**: MongoDB & Mongoose ORM
*   **WebSockets**: Socket.io (real-time log broadcasts)
*   **AI Integration**: [Ollama](https://ollama.com) running Qwen locally (`qwen3:1.7b` for text, `qwen3-embedding:0.6b` for embeddings)
*   **Security**: JWT Auth, bcryptjs, Helmet, Express Rate Limiter, AES-256-GCM encryption
*   **Utilities**: PDF-parse (file extraction), Axios (API handler), Nodemailer (Email integration)

---

## 📁 Repository Structure

```text
FlowAi/
├── backend/                  # Express REST API & DAG Execution Engine
│   ├── config/               # Database, Security, & Environment Configs
│   ├── controllers/          # Business logic handlers (Auth, Workflows, Secrets, etc.)
│   ├── execution/            # Core DAG parser and node execution runner
│   │   ├── __tests__/        # Node & engine logic unit tests
│   │   ├── nodeHandlers/     # Individual task processors (Local AI, API, Email, etc.)
│   │   └── utils/            # Variables resolver, RAG helper
│   ├── middlewares/          # Auth guards & validation filters
│   ├── models/               # MongoDB schema models (User, Workflow, Execution, Secret)
│   ├── routes/               # API router mapping
│   ├── socket/               # Socket.io connection state management
│   ├── server.js             # API entrypoint
│   └── .env.example          # Sample environment variables
│
├── frontend/                 # React SPA & 3D Interactive Client
│   ├── src/
│   │   ├── components/       # Reusable components (Sidebar, Console, Navbar, Secrets)
│   │   ├── landing/          # 3D Landing Page built with R3F
│   │   ├── nodes/            # Custom React Flow canvas nodes (APINode, OllamaNode, etc.)
│   │   ├── pages/            # Core routes (Builder, Dashboard, Auth)
│   │   ├── services/         # Axios & Socket.io network clients
│   │   └── store/            # Zustand global state hooks
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json              # Workspace script manager
└── .gitignore                # Git ignore files configuration
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/en) (v18.x or higher)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) (local or MongoDB Atlas cluster)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sambhavshah0425/Flow_Ai.git
   cd Flow_Ai
   ```

2. **Configure Backend Environment**
   Navigate to the `backend` directory, create a `.env` file, and populate it based on `.env.example`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Provide your MongoDB URI, JWT Secret, 64-character hex Encryption Key (for encrypting secrets), and the Ollama settings:
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

   All AI runs locally. Install [Ollama](https://ollama.com), then pull the models once:
   ```bash
   ollama pull qwen3:1.7b            # text generation (Local AI node, copilots)
   ollama pull qwen3-embedding:0.6b  # optional: Embed & Retrieve nodes (else an offline keyword fallback is used)
   ```
   See [OLLAMA_QWEN_GUIDE.md](OLLAMA_QWEN_GUIDE.md) for details.

3. **Install Dependencies**
   Run the following commands to install dependencies for the root, backend, and frontend:
   ```bash
   # In root directory
   npm install
   
   # For Backend
   cd backend && npm install
   
   # For Frontend
   cd ../frontend && npm install
   ```

---

## 💻 Running the Application

You can launch both frontend and backend concurrently or independently from the root folder:

### Start Backend Development Server
```bash
npm run dev:backend
# Server runs on http://localhost:5000
```

### Start Frontend Development Server
```bash
npm run dev:frontend
# Client dev server runs on http://localhost:5173
```

---

## 🧩 Supported Node Catalog

| Node Type | Icon | Inputs | Outputs | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Text Node** | 📝 | Static text config | `text` | Declares raw, static text constants for downstream nodes. |
| **Local AI (Qwen)** | 🤖 | Prompt, optional system prompt, model | `text` | Runs the prompt on a local Qwen model through Ollama and returns the generated text. Supports variables. |
| **API Request** | 🌐 | URL, method, headers, payload | `response`, `status` | Executes external HTTP requests (GET/POST/PUT/DELETE) and returns JSON data. |
| **PDF Extractor**| 📄 | URL, File upload | `text` | Downloads a PDF document and extracts its complete text content. |
| **RAG / Retrieve**| 🔍 | Query, top K | `context`, `matches` | Semantic search over the chunks indexed by an upstream Embed node. |
| **Email Node** | ✉️ | SMTP configs, recipient, body | `success` | Connects to an SMTP server and sends automated HTML/Plain text emails. |
| **Condition Node**| 🔀 | Value A, Operator, Value B | Branches execution | Evaluates conditions (`==`, `!=`, `>`, `<`, `contains`) and routes DAG execution accordingly. |
| **Delay Node** | ⏳ | Duration (ms) | Pauses execution | Delays execution of subsequent connected nodes by the specified duration. |
| **Download Node**| 📥 | Source text/URL, filename | File stream | Triggers a browser file download of configured text content or remote URLs. |
| **Embed Node** | 🔑 | Text input, chunk size | `chunks` | Chunks text and embeds it with Qwen embeddings (or an offline fallback) for Retrieve nodes. |

---

## 🔗 Variable Resolution Syntax

Flow_Ai's execution engine features a dynamic resolver that fetches output values from upstream nodes. You can link nodes by placing variables in input fields of downstream nodes:

```text
{{node_id.output_variable}}
```

### Example:
1. **Text Node** (ID: `text_1`): Declares text output: `Hello World`.
2. **Local AI Node** (ID: `ollama_1`): Configures prompt input as:
   `Summarize the following text: {{text_1.text}}`
3. At runtime, the execution engine automatically replaces `{{text_1.text}}` with `Hello World` before sending it to Qwen.

---

## 🧪 Testing

To run backend tests (covering parsing logic, conditions, variable resolutions):
```bash
cd backend
npm run test
```
*Tests are powered by [Vitest](https://vitest.dev/).*

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
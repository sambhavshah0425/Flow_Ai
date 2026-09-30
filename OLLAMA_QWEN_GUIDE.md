# Qwen Copilot (Ollama): how it works

A free, local AI assistant inside the Workflow Builder. You describe an automation in plain words. Qwen asks a question if it's missing something essential, then builds the connected nodes on your canvas. Any AI steps inside those workflows also run on Qwen.

## 1. One-time setup

```bash
# 1. Install Ollama (Windows)
winget install Ollama.Ollama        # or download from https://ollama.com

# 2. Download the Qwen model (~1.4 GB, once)
ollama pull qwen3:1.7b

# 3. Check it works
ollama run qwen3:1.7b "Say hi"
```

Ollama runs in the background on `http://localhost:11434`. Restart the backend (`npm run dev:backend`), open **Workflow Studio**, and click **Chat with Qwen**. The badge turns green when it's ready.

**Optional settings** in `backend/.env` (these are the defaults):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:1.7b
```

`qwen3:1.7b` suits an 8 GB laptop with no GPU. `qwen3:4b` gives better answers but is slower. Pull it first, then set `OLLAMA_MODEL=qwen3:4b`.

## 2. How a chat turn flows

```text
You type "Summarize a PDF and email it to me"
  → CopilotChatPanel.jsx          (UI)
  → useCopilotStore.sendMessage   sends: chat history + current canvas
  → POST /api/copilot/chat        (copilotController.js, behind JWT auth)
  → ollamaChat()                  Qwen gets: system prompt (node manual) + canvas + history
                                  and a JSON schema, so it MUST reply as:
                                  { action: "ask" | "build", reply, workflow? }
  ← "ask"   → Qwen's question shows in the chat, you answer, repeat
  ← "build" → workflow is cleaned (normalizeAndValidateWorkflow), checked for loops (parseDAG),
              laid out left-to-right (autoLayout) → placed on the canvas automatically
```

**Email safety check.** Small models invent recipients like `user@example.com`, so `checkEmailRecipients()` doesn't trust the model. An Email node may only use an address you actually typed, one already on the canvas, or a `{{template}}`. Otherwise the copilot asks *"Which email address should I send it to?"*, once only.

The untouched starter canvas is not sent to the model. Otherwise Qwen tries to "edit" it instead of building what you asked for. Once you have a real workflow on the canvas, you can keep refining it: "also email me", "use a delay first", and so on. Qwen returns the full updated workflow.

**Speed and warm-up.** Measured on this laptop (CPU only), a cold message cost about 9 s to load the model, about 40 s to read the instructions, and about 25 s to write the answer. Opening the chat panel calls `POST /api/copilot/warmup`, which loads Qwen and pre-reads the instructions in the background. Ollama caches that work, and `keep_alive: 30m` keeps it in memory, so your messages only pay the ~25 s writing step. A shorter prompt was tried and rejected: the 1.7B model then built incomplete, single-node workflows. The three examples in the prompt matter, because the model copies the one closest to your request.

**No training is involved.** The system prompt in `copilotController.js` is the model's whole "manual": the node types, their fields, the `{{node.field}}` rule, and one example. To change how the copilot behaves, edit that prompt.

## 3. Files added or changed

| File | What it does |
|---|---|
| `backend/utils/ollamaClient.js` | **new**: `ollamaChat()` and `ollamaStatus()`; turns errors into "run `ollama pull …`" messages |
| `backend/controllers/copilotController.js` | **new**: chat endpoint, system prompt, JSON schema, auto-layout |
| `backend/routes/copilotRoutes.js` | **new**: `GET /api/copilot/status`, `POST /api/copilot/chat` |
| `backend/execution/nodeHandlers/ollamaHandler.js` | **new**: the "Local AI (Qwen)" node; output `{{ollama_1.text}}` |
| `backend/execution/nodeHandlers/index.js` | registers `ollama` |
| `backend/execution/executionEngine.js` | `ollama` nodes get a 3-minute timeout (others keep 30 s) |
| `backend/controllers/aiWorkflowController.js` | normalizer accepts the `ollama` type |
| `backend/app.js` | mounts `/api/copilot` |
| `backend/.env.example` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |
| `frontend/src/components/CopilotChatPanel.jsx` | **new**: chat UI, status badge, setup hint |
| `frontend/src/store/useCopilotStore.js` | **new**: messages, send, status |
| `frontend/src/nodes/OllamaNode.jsx` | **new**: canvas node |
| `frontend/src/store/useWorkflowStore.js` | `applyGeneratedWorkflow()`, `ollama` default data |
| `frontend/src/nodes/nodeTypes.js`, `components/NodeSidebar.jsx`, `components/NodeInspector.jsx` | `ollama` node in the palette and inspector |
| `frontend/src/pages/WorkflowBuilderPage.jsx` | **Chat with Qwen** button and panel |
| `backend/__tests__/copilot.test.js`, `backend/execution/__tests__/ollamaHandler.test.js` | **new** tests (fake Ollama, so no install needed) |

## 4. Troubleshooting

| Symptom | Fix |
|---|---|
| Badge says **offline** | Ollama isn't running: start the Ollama app, or run `ollama serve` |
| Badge says **model missing** | `ollama pull qwen3:1.7b` (or whatever `OLLAMA_MODEL` is set to) |
| Replies take ~25–30 s | Normal on CPU. Nearly all of it is Qwen writing the workflow JSON (~10 tokens/s). Close heavy apps to help |
| The very first reply is slow (~70 s) | You sent it within ~40 s of opening the panel, before the warm-up finished. Later messages are fast |
| Workflow is odd or incomplete | Be more specific, say "build it", or try `qwen3:4b` |
| "did not respond within 180s" | The model is too slow for this machine; use a smaller one |

## 5. Deployment note

Ollama must run on the same machine or network as the backend. Free hosts such as Render or Vercel can't run it. For a hosted demo, rent a VM with 8 GB+ RAM, or keep Gemini as the cloud AI there. Never expose port 11434 publicly: Ollama has no authentication.

# Training & Tuning Qwen for Flow_Ai (and the Chat with Qwen Bot)

Your laptop runs on **CPU + ~7.7 GB RAM**, where `qwen3:1.7b` (`Q4_K_M`, ~1.36 GB) gives the best balance of speed and reliability.

---

## 1. Collect Real Training Conversations Right Inside Chat with Qwen

Every time you chat with **Qwen Copilot** in the Workflow Builder:
1. Ask Qwen to build or edit a workflow (or fix/refine the resulting nodes on your canvas).
2. Click **`Save to train`** under Qwen's reply.
3. Flow_Ai validates the workflow DAG, strips secrets/SMTP fields, and saves the exact conversation + canvas workflow into [`custom_copilot_examples.jsonl`](./custom_copilot_examples.jsonl).

Then compile your validated training files:

```bash
node training/build_dataset.mjs
```

This generates:
- `training/dist/copilot_train.jsonl` & `training/dist/copilot_eval.jsonl` — dedicated **Chat with Qwen Bot** multi-turn & workflow-building dataset.
- `training/dist/train.jsonl` & `training/dist/eval.jsonl` — combined Copilot + Execution Node (RAG / JSON / Summarization) dataset.

---

## 2. Option A — Instant Copilot & Specialist Models Today (No GPU Needed)

Bake strict precision/JSON rules and low temperature right into local Ollama models:

```bash
ollama create flowforge-copilot -f training/Modelfile.copilot
ollama create flowforge-qwen -f training/Modelfile
```

Also pull the embedding model so PDF/RAG nodes stop falling back to offline keyword matching:

```bash
ollama pull qwen3-embedding:0.6b
```

In `backend/.env`:
- `OLLAMA_COPILOT_MODEL=flowforge-copilot` powers **Chat with Qwen** automatically.
- `OLLAMA_MODEL=flowforge-qwen` (or selecting **`flowforge-qwen`** in any Local AI node) powers workflow execution nodes.

---

## 3. Option B — Real LoRA Fine-Tuning for Chat with Qwen (Free Google Colab T4 GPU)

Because fine-tuning weights needs a CUDA GPU (`15+ GB VRAM`), train in Colab for free and run the resulting `Q4_K_M` GGUF locally at the **exact same speed** as `qwen3:1.7b`:

1. Record examples with **`Save to train`** in Chat with Qwen (recommended: 25–100+ real examples) and run `node training/build_dataset.mjs`.
2. Open [`train_qwen3_colab.ipynb`](./train_qwen3_colab.ipynb) in Google Colab (**T4 GPU** runtime).
3. Upload `training/dist/copilot_train.jsonl` and `training/dist/copilot_eval.jsonl`.
4. Run all cells to fine-tune `unsloth/Qwen3-1.7B` (`enable_thinking=False`) and export the `.gguf` (`Q4_K_M`).
5. Download the `.gguf` into `training/`, update the `FROM` line in [`Modelfile.copilot`](./Modelfile.copilot), and run:
   ```bash
   ollama create flowforge-copilot -f training/Modelfile.copilot
   ```
6. Restart the backend — **Chat with Qwen** immediately runs your fine-tuned weights!

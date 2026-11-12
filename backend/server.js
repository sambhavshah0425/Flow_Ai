import './config/loadEnv.js';
import http from 'http';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './socket/socketServer.js';
import { ollamaWarmup, getOllamaCopilotModel } from './utils/ollamaClient.js';
import { SYSTEM_PROMPT as COPILOT_SYSTEM_PROMPT } from './controllers/copilotController.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = initSocketServer(server);

// Start Database & Server
async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🚀 FlowForge OS Backend Engine Running on Port ${PORT}`);
    console.log(` 🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);

    // Pre-load the local Qwen model + prompt cache in the background so the
    // first chat/workflow execution responds quickly (no-op if Ollama is down).
    if (process.env.NODE_ENV !== 'test') {
      ollamaWarmup(COPILOT_SYSTEM_PROMPT, { model: getOllamaCopilotModel() }).then((warmed) => {
        if (warmed) {
          console.log(`[Ollama] Copilot model (${getOllamaCopilotModel()}) & prompt cache warmed up.`);
        }
      });
    }
  });
}

startServer();

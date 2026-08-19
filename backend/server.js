import './config/loadEnv.js';
import http from 'http';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './socket/socketServer.js';

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
  });
}

startServer();

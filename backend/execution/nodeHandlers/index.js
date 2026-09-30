import { nodeRegistry } from '../nodeRegistry.js';
import { textHandler } from './textHandler.js';
import { pdfHandler } from './pdfHandler.js';
import { apiHandler } from './apiHandler.js';
import { delayHandler } from './delayHandler.js';
import { downloadHandler } from './downloadHandler.js';
import { conditionHandler } from './conditionHandler.js';
import { embedHandler } from './embedHandler.js';
import { retrieveHandler } from './retrieveHandler.js';
import { emailHandler } from './emailHandler.js';
import { ollamaHandler } from './ollamaHandler.js';

export function registerDefaultHandlers() {
  nodeRegistry.register('text', textHandler);
  nodeRegistry.register('pdf', pdfHandler);
  nodeRegistry.register('api', apiHandler);
  nodeRegistry.register('delay', delayHandler);
  nodeRegistry.register('download', downloadHandler);
  nodeRegistry.register('condition', conditionHandler);
  nodeRegistry.register('embed', embedHandler);
  nodeRegistry.register('retrieve', retrieveHandler);
  nodeRegistry.register('email', emailHandler);
  nodeRegistry.register('ollama', ollamaHandler);
  // Legacy alias: workflows saved with Gemini nodes now run on local Qwen.
  nodeRegistry.register('gemini', ollamaHandler);
}

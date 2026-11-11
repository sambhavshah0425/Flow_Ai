import axios from 'axios';
import { resolveVariables } from '../utils/variableResolver.js';

export async function apiHandler(node, context) {
  const nodeData = node.data || {};
  const rawUrl = nodeData.url || 'https://jsonplaceholder.typicode.com/posts/1';
  const method = (nodeData.method || 'GET').toUpperCase();
  const rawBody = nodeData.body ? (typeof nodeData.body === 'string' ? nodeData.body : JSON.stringify(nodeData.body)) : '';

  const url = resolveVariables(rawUrl, context);
  const resolvedBodyStr = resolveVariables(rawBody, context);

  const hasBodyMethod = method === 'POST' || method === 'PUT' || method === 'PATCH';
  let dataPayload;
  if (resolvedBodyStr && hasBodyMethod) {
    try {
      dataPayload = JSON.parse(resolvedBodyStr);
    } catch {
      dataPayload = resolvedBodyStr;
    }
  }

  const defaultHeaders = dataPayload !== undefined ? { 'Content-Type': 'application/json' } : {};
  const startTime = Date.now();
  const response = await axios({
    method,
    url,
    ...(dataPayload !== undefined ? { data: dataPayload } : {}),
    headers: nodeData.headers || defaultHeaders,
    timeout: nodeData.timeoutMs || 10000
  });

  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    durationMs: Date.now() - startTime
  };
}

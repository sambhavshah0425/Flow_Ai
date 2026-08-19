export async function delayHandler(node, context) {
  const nodeData = node.data || {};
  const delayMs = parseInt(nodeData.delayMs) || 1000;

  await new Promise(resolve => setTimeout(resolve, delayMs));

  return {
    delayedMs: delayMs,
    completedAt: new Date().toISOString()
  };
}

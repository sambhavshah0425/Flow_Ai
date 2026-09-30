/**
 * DAG Parser & Graph Validator
 * Validates nodes & edges, detects cycles, and calculates topological sort order.
 */
export function parseDAG(nodes = [], edges = []) {
  if (!nodes || nodes.length === 0) {
    throw new Error('Workflow contains no nodes.');
  }

  const inDegree = {};
  const graph = {};
  const nodeMap = {};

  // Build adjacency list and in-degree maps
  nodes.forEach(node => {
    inDegree[node.id] = 0;
    graph[node.id] = [];
    nodeMap[node.id] = node;
  });

  edges.forEach(edge => {
    const { source, target } = edge;
    if (graph[source] && inDegree[target] !== undefined) {
      graph[source].push(target);
      inDegree[target] += 1;
    }
  });

  // Kahn's Algorithm for Topological Sort
  const queue = [];
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  });

  const sortedNodeIds = [];
  while (queue.length > 0) {
    const currentId = queue.shift();
    sortedNodeIds.push(currentId);

    const neighbors = graph[currentId] || [];
    neighbors.forEach(neighborId => {
      inDegree[neighborId] -= 1;
      if (inDegree[neighborId] === 0) {
        queue.push(neighborId);
      }
    });
  }

  // Cycle Detection Check
  if (sortedNodeIds.length !== nodes.length) {
    throw new Error('Circular dependency (cycle) detected in workflow diagram.');
  }

  // Return nodes sorted in execution order
  const orderedNodes = sortedNodeIds.map(id => nodeMap[id]);

  // Compute a "level" per node = its distance from the nearest root, using the
  // already-topologically-sorted order so each node's dependencies are always
  // resolved before it's visited. Nodes sharing a level have no dependency
  // relationship to each other and can safely be executed in parallel.
  const level = {};
  sortedNodeIds.forEach(id => { level[id] = 0; });

  // Walk nodes in topo order, pushing level = 1 + max(level of incoming sources)
  const incomingBySource = {};
  edges.forEach(edge => {
    if (!incomingBySource[edge.target]) incomingBySource[edge.target] = [];
    incomingBySource[edge.target].push(edge.source);
  });
  sortedNodeIds.forEach(id => {
    const sources = incomingBySource[id] || [];
    let maxLevel = -1;
    sources.forEach(srcId => {
      if (level[srcId] !== undefined && level[srcId] > maxLevel) maxLevel = level[srcId];
    });
    level[id] = maxLevel + 1;
  });

  const maxLevelValue = sortedNodeIds.reduce((max, id) => Math.max(max, level[id]), 0);
  const levels = [];
  for (let i = 0; i <= maxLevelValue; i++) levels.push([]);
  sortedNodeIds.forEach(id => {
    levels[level[id]].push(nodeMap[id]);
  });

  return {
    orderedNodes,
    sortedNodeIds,
    levels, // array of arrays — nodes in the same bucket can run concurrently
    hasCycle: false
  };
}

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
  return {
    orderedNodes,
    sortedNodeIds,
    hasCycle: false
  };
}

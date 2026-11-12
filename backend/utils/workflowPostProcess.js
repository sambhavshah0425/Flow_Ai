import { parseDAG } from '../execution/dagParser.js';

const DEFAULT_OUTPUT_FIELD = {
  api: 'data',
  retrieve: 'context'
};

/**
 * Lay nodes out left-to-right by dependency depth, centring each column
 * vertically, so branches (true/false) don't pile on top of each other.
 */
export function autoLayout(nodes, edges) {
  const { levels } = parseDAG(nodes, edges);
  const positions = {};
  levels.forEach((levelNodes, col) => {
    levelNodes.forEach((node, row) => {
      positions[node.id] = {
        x: 100 + col * 340,
        y: 200 + (row - (levelNodes.length - 1) / 2) * 170
      };
    });
  });
  return nodes.map((n) => ({ ...n, position: positions[n.id] || n.position }));
}

/**
 * Small local models sometimes append an unrequested `text` node downstream
 * of `ollama`/`email` ("to store the summary") or route `ollama -> text -> download`.
 * Because `text` nodes perform no computation, drop leaf sinks and bypass
 * pass-through `text` aliases while keeping genuine root `text` inputs untouched.
 */
export function stripRedundantTextSinks(workflow) {
  let nodes = workflow.nodes.map((n) => ({ ...n, data: { ...(n.data || {}) } }));
  let edges = workflow.edges.map((e) => ({ ...e }));

  for (let step = 0; step < workflow.nodes.length && nodes.length > 1; step++) {
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const target = nodes.find((n) => {
      if (n.type !== 'text') return false;
      const inEdges = edges.filter((e) => e.target === n.id);
      if (inEdges.length === 0) return false;
      const outEdges = edges.filter((e) => e.source === n.id);
      if (outEdges.length > 0 && inEdges.length !== 1) return false;
      const rawText = String(n.data.text ?? n.data.content ?? '').trim();
      const fromCondition = inEdges.some((e) => nodeById.get(e.source)?.type === 'condition');
      return !fromCondition || rawText === '' || rawText.includes('{{');
    });

    if (!target) break;

    const inEdges = edges.filter((e) => e.target === target.id);
    const outEdges = edges.filter((e) => e.source === target.id);

    if (outEdges.length > 0) {
      const srcEdge = inEdges[0];
      const srcNode = nodeById.get(srcEdge.source);
      const rawText = String(target.data.text ?? target.data.content ?? '').trim();
      const defaultField = DEFAULT_OUTPUT_FIELD[srcNode?.type] || 'text';
      const replacement = rawText.includes('{{') ? rawText : `{{${srcNode.id}.${defaultField}}}`;
      const refRe = new RegExp(`\\{\\{\\s*${target.id}\\.(?:text|output|content)\\s*\\}\\}`, 'g');

      for (const n of nodes) {
        if (n.id === target.id) continue;
        for (const [k, v] of Object.entries(n.data)) {
          if (typeof v === 'string' && v.includes(target.id)) {
            n.data[k] = v.replace(refRe, replacement);
          }
        }
      }

      const rewired = outEdges.map((outEdge) => ({
        ...outEdge,
        id: `e_${srcEdge.source}_to_${outEdge.target}`,
        source: srcEdge.source,
        target: outEdge.target,
        sourceHandle: srcEdge.sourceHandle,
        ...(srcEdge.style ? { style: srcEdge.style } : {})
      }));
      const seen = new Set();
      edges = [
        ...edges.filter((e) => e.source !== target.id && e.target !== target.id),
        ...rewired
      ].filter((e) => {
        const key = `${e.source}|${e.target}|${e.sourceHandle || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else {
      edges = edges.filter((e) => e.target !== target.id);
    }

    nodes = nodes.filter((n) => n.id !== target.id);
  }

  return { ...workflow, nodes, edges };
}


import { GRAPH_NODES, GRAPH_EDGES } from './nodeGraphData';
import { Node3D } from './Node3D';
import { Edge3D } from './Edge3D';

const nodeById = Object.fromEntries(GRAPH_NODES.map((node) => [node.id, node]));

// Same milestone boundaries as the reveal ranges below, reused as the
// "camera focal window" — whichever node(s) the camera is centered on right
// now are active; already-revealed-but-not-current nodes dim. Past 0.75 the
// camera pulls back to the full-pipeline finale, so everything lights up
// together instead of one node staying highlighted.
const FOCAL_RANGES = [
  { ids: ['text_1'], start: 0.0, end: 0.15 },
  { ids: ['pdf_1'], start: 0.15, end: 0.3 },
  { ids: ['gemini_1'], start: 0.3, end: 0.45 },
  { ids: ['api_1', 'delay_1'], start: 0.45, end: 0.6 },
  { ids: ['download_1'], start: 0.6, end: 0.75 },
];

function getFocalIds(progress) {
  if (progress >= 0.75) return null; // null = finale, everything active
  const range = FOCAL_RANGES.find((r) => progress >= r.start && progress < r.end);
  return range ? range.ids : ['text_1'];
}

export function WorkflowGraphScene({ progress = 1.0, reducedMotion = false, execBoost = 1.0 }) {
  const getProgressState = (id) => {
    if (reducedMotion) return { revealed: true, revealProgress: 1.0 };

    let range = [0, 1];
    if (id === 'text_1') range = [0.0, 0.15];
    else if (id === 'pdf_1') range = [0.15, 0.30];
    else if (id === 'gemini_1') range = [0.30, 0.45];
    else if (id === 'edge_text_1_gemini_1') range = [0.30, 0.45];
    else if (id === 'edge_pdf_1_gemini_1') range = [0.30, 0.45];
    else if (id === 'api_1') range = [0.45, 0.60];
    else if (id === 'delay_1') range = [0.45, 0.60];
    else if (id === 'edge_gemini_1_api_1') range = [0.45, 0.60];
    else if (id === 'edge_gemini_1_delay_1') range = [0.45, 0.60];
    else if (id === 'download_1') range = [0.60, 0.75];
    else if (id === 'edge_delay_1_download_1') range = [0.60, 0.75];

    const [start, end] = range;
    if (progress < start) {
      return { revealed: false, revealProgress: 0.0 };
    }
    if (progress >= end) {
      return { revealed: true, revealProgress: 1.0 };
    }
    const val = (progress - start) / (end - start);
    return { revealed: true, revealProgress: val };
  };

  const focalIds = reducedMotion ? null : getFocalIds(progress);
  const isNodeActive = (id) => focalIds === null || focalIds.includes(id);

  return (
    <group>
      {GRAPH_EDGES.map((edge, i) => {
        const edgeId = `edge_${edge.from}_${edge.to}`;
        const { revealed, revealProgress } = getProgressState(edgeId);
        const isActive = isNodeActive(edge.from) || isNodeActive(edge.to);
        return (
          <Edge3D
            key={`${edge.from}-${edge.to}`}
            start={nodeById[edge.from].position}
            end={nodeById[edge.to].position}
            speed={0.28 + (i % 3) * 0.07}
            offset={i * 0.18}
            revealed={revealed}
            revealProgress={revealProgress}
            execBoost={execBoost}
            isActive={isActive}
          />
        );
      })}
      {GRAPH_NODES.map((node) => {
        const { revealed, revealProgress } = getProgressState(node.id);
        const isActive = isNodeActive(node.id);
        const isDim = revealed && !isActive;
        return (
          <Node3D
            key={node.id}
            node={node}
            revealed={revealed}
            revealProgress={revealProgress}
            execBoost={execBoost}
            isActive={isActive}
            isDim={isDim}
          />
        );
      })}
    </group>
  );
}

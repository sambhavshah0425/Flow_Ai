/**
 * Data model for the "physical system" hero scene, matched to the reference
 * recording: a central machined puck node with four physical tube pathways
 * rising to floating "stacked" info cards (Website/Database higher and
 * centered, Application/Warehouse lower and to the outside), and two fanned
 * rows of connected app-icon tiles branching down from underneath the node.
 */
export const CENTER = [0, 0, 0];

// Mirrored left/right so the top-down composition reads as a symmetric
// schematic: the inner pair sits farther back (higher in frame), the outer
// pair sits wider and nearer (flanking the hub at mid-frame).
export const INFO_CARDS = [
  { id: 'card_website', label: 'Frontend Portal', icon: 'Globe', position: [-1.4, 1.5, -1.2] },
  { id: 'card_database', label: 'Vector DB Store', icon: 'Database', position: [1.4, 1.5, -1.2] },
  { id: 'card_application', label: 'Agent API Gateway', icon: 'Code2', position: [-3.25, 1.15, 0.25] },
  { id: 'card_warehouse', label: 'Email Notification', icon: 'Mail', position: [3.25, 1.15, 0.25] },
];

// Module chips stay inside the electric-blue family — tints of #0059ff give
// each tile its own weight without breaking the single-accent colour rule.
const ICON_ROW_1 = [
  { id: 'tile_text', label: 'Text Input', icon: 'Type', color: '#0059ff' },
  { id: 'tile_pdf', label: 'PDF Parser', icon: 'FileText', color: '#4d8cff' },
  { id: 'tile_gemini', label: 'Gemini AI', icon: 'Sparkles', color: '#7aa7ff' },
  { id: 'tile_api', label: 'REST API', icon: 'Globe', color: '#0047d1' },
  { id: 'tile_email', label: 'Send Email', icon: 'Mail', color: '#3d7bff' },
  { id: 'tile_condition', label: 'Branch (IF)', icon: 'GitBranch', color: '#0059ff' },
  { id: 'tile_delay', label: 'Delay Node', icon: 'Clock', color: '#12408f' },
];

const ICON_ROW_2 = [
  { id: 'tile_download', label: 'Downloader', icon: 'Download', color: '#4d8cff' },
  { id: 'tile_retrieve', label: 'Retrieve DB', icon: 'Search', color: '#0059ff' },
  { id: 'tile_embed', label: 'Embeddings', icon: 'Database', color: '#0037a3' },
  { id: 'tile_gemini2', label: 'Vision AI', icon: 'Sparkles', color: '#7aa7ff' },
  { id: 'tile_api2', label: 'Webhook', icon: 'Globe', color: '#0047d1' },
  { id: 'tile_db2', label: 'DB Cache', icon: 'Database', color: '#12408f' },
  { id: 'tile_alert', label: 'System Alert', icon: 'Mail', color: '#3d7bff' },
];

// Flat, evenly-spaced rows. The previous sine "arc" staggered each tile's
// height and depth, which read as a ragged zigzag under the top-down camera
// instead of the reference's clean aligned bank of modules.
function layoutRow(row, span, z, y) {
  return row.map((tile, i) => {
    const t = row.length === 1 ? 0.5 : i / (row.length - 1);
    return { ...tile, position: [(t - 0.5) * span, y, z] };
  });
}

/**
 * Conduits leave the hub from a point on its rim facing the target, rather
 * than from the world origin. Starting every tube at [0,0,0] made them all
 * rise through one shared column above the puck — a convergent spike — where
 * the reference has them emerging from around and behind the hub.
 */
const HUB_EXIT_RADIUS = 1.45;
const HUB_EXIT_Y = -0.4;

function hubExit(end) {
  const [x, , z] = end;
  const len = Math.hypot(x, z) || 1;
  return [(x / len) * HUB_EXIT_RADIUS, HUB_EXIT_Y, (z / len) * HUB_EXIT_RADIUS];
}

/**
 * Conduits stop at the hub-facing edge of a card rather than at its centre.
 * Running them to the centre made the hose plunge through the panel face and
 * come out the front, instead of docking into its side the way the reference
 * shows.
 */
function cardEntry(pos) {
  const [x, y, z] = pos;
  const len = Math.hypot(x, z) || 1;
  return [x - (x / len) * 0.6, y - 0.3, z - (z / len) * 0.6];
}

// Rows sit nearer the hub than a horizontal camera would need: under the
// 54° top-down view, depth in Z reads as vertical screen distance, so a
// shallower fan is what keeps the bottom row clear of the frame edge.
export const ICON_TILES = [
  ...layoutRow(ICON_ROW_1, 7.0, 2.05, -0.5),
  ...layoutRow(ICON_ROW_2, 6.1, 2.75, -0.8),
];

/** Tube pathways: physical conduits from the center to each card/tile, keyed for reveal syncing. */
export const CARD_PATHWAYS = INFO_CARDS.map((card) => ({
  id: `path_${card.id}`,
  targetId: card.id,
  start: hubExit(card.position),
  end: cardEntry(card.position),
  lift: 0.7,
}));

export const TILE_PATHWAYS = ICON_TILES.map((tile) => ({
  id: `path_${tile.id}`,
  targetId: tile.id,
  start: hubExit(tile.position),
  end: tile.position,
  lift: 0.38,
}));

export const SYSTEM_DESCRIPTION =
  'Interactive 3D visualization of the FlowForge OS core: a central engine node connected by physical pathways to Website, Database, Application, and Warehouse status cards, and to two fanned rows of connected AI, API, and automation modules, with green energy pulses traveling through the network.';

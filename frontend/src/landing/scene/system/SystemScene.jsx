import { INFO_CARDS, ICON_TILES, CARD_PATHWAYS, TILE_PATHWAYS } from './systemData';
import { CentralNode3D } from './CentralNode3D';
import { Tube3D } from './Tube3D';
import { InfoCard3D } from './InfoCard3D';
import { IconTile3D } from './IconTile3D';
import { Environment3D } from './Environment3D';

/**
 * Sequential build rhythm driven by scroll progress (0-1):
 *   0.00-0.08  central node establishes itself (camera macro close-up)
 *   0.08-0.78  each card and tile pathway draws in turn, one after another
 *   0.78-1.00  energy is fully active and the whole system is visible together
 */
function rangeProgress(progress, start, end) {
  if (progress < start) return { revealed: false, revealProgress: 0 };
  if (progress >= end) return { revealed: true, revealProgress: 1 };
  return { revealed: true, revealProgress: (progress - start) / (end - start) };
}

const BUILD_START = 0.08;
const BUILD_END = 0.78;
const ITEM_WINDOW = 0.16; // each item's own reveal window, overlapping the next for a smooth relay rather than a hard cut

/** Assigns item `index` of `total` an overlapping [start, end] slice of the build range, in build order. */
function itemRange(index, total) {
  const span = BUILD_END - BUILD_START;
  const step = total > 1 ? (span - ITEM_WINDOW) / (total - 1) : 0;
  const start = BUILD_START + step * index;
  return [start, Math.min(start + ITEM_WINDOW, BUILD_END)];
}

// Build order: two center-top cards, then the two outer cards, then the icon rows outward from center.
const BUILD_ORDER = [...INFO_CARDS, ...ICON_TILES].map((item) => item.id);
const orderIndex = (id) => BUILD_ORDER.indexOf(id);
const TOTAL_ITEMS = BUILD_ORDER.length;

export function SystemScene({ progress = 1.0, reducedMotion = false }) {
  const p = reducedMotion ? 1 : progress;
  const nodeState = rangeProgress(p, 0.0, BUILD_START);
  const activation = p >= BUILD_END ? Math.min(1, (p - BUILD_END) / (1 - BUILD_END)) : 0;
  const active = p >= BUILD_END - 0.05;

  const stateFor = (id) => {
    if (reducedMotion) return { revealed: true, revealProgress: 1 };
    const [start, end] = itemRange(orderIndex(id), TOTAL_ITEMS);
    return rangeProgress(p, start, end);
  };

  return (
    <group>
      <Environment3D />

      <group scale={nodeState.revealed ? 0.9 + 0.1 * nodeState.revealProgress : 0.9}>
        <CentralNode3D activation={activation} />
      </group>

      {CARD_PATHWAYS.map((path, i) => {
        const s = stateFor(path.targetId);
        return (
          <Tube3D
            key={path.id}
            start={path.start}
            end={path.end}
            lift={path.lift}
            speed={0.18 + (i % 3) * 0.05}
            offset={i * 0.22}
            revealed={s.revealed}
            revealProgress={s.revealProgress}
            active={active}
            radius={0.095}
          />
        );
      })}
      {TILE_PATHWAYS.map((path, i) => {
        const s = stateFor(path.targetId);
        return (
          <Tube3D
            key={path.id}
            start={path.start}
            end={path.end}
            lift={path.lift}
            speed={0.24 + (i % 4) * 0.04}
            offset={i * 0.15}
            revealed={s.revealed}
            revealProgress={s.revealProgress}
            active={active}
            radius={0.07}
          />
        );
      })}

      {INFO_CARDS.map((card) => {
        const s = stateFor(card.id);
        return <InfoCard3D key={card.id} card={card} revealed={s.revealed} revealProgress={s.revealProgress} active={active} />;
      })}
      {ICON_TILES.map((tile) => {
        const s = stateFor(tile.id);
        return <IconTile3D key={tile.id} tile={tile} revealed={s.revealed} revealProgress={s.revealProgress} active={active} />;
      })}
    </group>
  );
}

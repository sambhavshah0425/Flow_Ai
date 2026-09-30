import { describe, it, expect } from 'vitest';
import { parseDAG } from '../dagParser.js';

describe('parseDAG', () => {
  describe('basic ordering', () => {
    it('orders a simple linear chain A -> B -> C correctly', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' }
      ];

      const { sortedNodeIds, orderedNodes } = parseDAG(nodes, edges);

      expect(sortedNodeIds).toEqual(['A', 'B', 'C']);
      expect(orderedNodes.map(n => n.id)).toEqual(['A', 'B', 'C']);
    });

    it('runs a single isolated node with no edges', () => {
      const nodes = [{ id: 'solo' }];
      const { sortedNodeIds } = parseDAG(nodes, []);

      expect(sortedNodeIds).toEqual(['solo']);
    });

    it('places all independent (unconnected) nodes in the result, in some valid order', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const { sortedNodeIds } = parseDAG(nodes, []);

      expect(sortedNodeIds).toHaveLength(3);
      expect(new Set(sortedNodeIds)).toEqual(new Set(['A', 'B', 'C']));
    });

    it('respects dependency order in a diamond shape (A -> B, A -> C, B -> D, C -> D)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' }
      ];

      const { sortedNodeIds } = parseDAG(nodes, edges);

      const posA = sortedNodeIds.indexOf('A');
      const posB = sortedNodeIds.indexOf('B');
      const posC = sortedNodeIds.indexOf('C');
      const posD = sortedNodeIds.indexOf('D');

      expect(posA).toBeLessThan(posB);
      expect(posA).toBeLessThan(posC);
      expect(posB).toBeLessThan(posD);
      expect(posC).toBeLessThan(posD);
    });

    it('preserves each node object (not just IDs) in orderedNodes', () => {
      const nodes = [
        { id: 'A', type: 'text', data: { text: 'hello' } },
        { id: 'B', type: 'ollama', data: { prompt: '{{A.text}}' } }
      ];
      const edges = [{ source: 'A', target: 'B' }];

      const { orderedNodes } = parseDAG(nodes, edges);

      expect(orderedNodes[0]).toEqual(nodes[0]);
      expect(orderedNodes[1]).toEqual(nodes[1]);
    });
  });

  describe('cycle detection', () => {
    it('throws on a direct 2-node cycle (A -> B -> A)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }];
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' }
      ];

      expect(() => parseDAG(nodes, edges)).toThrow(/circular dependency/i);
    });

    it('throws on a self-loop (A -> A)', () => {
      const nodes = [{ id: 'A' }];
      const edges = [{ source: 'A', target: 'A' }];

      expect(() => parseDAG(nodes, edges)).toThrow(/circular dependency/i);
    });

    it('throws on a longer 3-node cycle (A -> B -> C -> A)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'A' }
      ];

      expect(() => parseDAG(nodes, edges)).toThrow(/circular dependency/i);
    });

    it('throws when a cycle exists alongside otherwise-valid nodes', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'A' }
      ];

      expect(() => parseDAG(nodes, edges)).toThrow(/circular dependency/i);
    });
  });

  describe('input validation & edge cases', () => {
    it('throws when nodes array is empty', () => {
      expect(() => parseDAG([], [])).toThrow(/no nodes/i);
    });

    it('throws when nodes is undefined (default param kicks in as empty array)', () => {
      expect(() => parseDAG(undefined, [])).toThrow(/no nodes/i);
    });

    it('ignores edges that reference a non-existent source node', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }];
      const edges = [{ source: 'ghost', target: 'B' }];

      const { sortedNodeIds } = parseDAG(nodes, edges);
      expect(new Set(sortedNodeIds)).toEqual(new Set(['A', 'B']));
    });

    it('ignores edges that reference a non-existent target node', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }];
      const edges = [{ source: 'A', target: 'ghost' }];

      const { sortedNodeIds } = parseDAG(nodes, edges);
      expect(new Set(sortedNodeIds)).toEqual(new Set(['A', 'B']));
    });

    it('handles a workflow with no edges at all (all nodes independent)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const { sortedNodeIds, hasCycle } = parseDAG(nodes, []);

      expect(sortedNodeIds).toHaveLength(3);
      expect(hasCycle).toBe(false);
    });

    it('handles edges array being omitted entirely (uses default [])', () => {
      const nodes = [{ id: 'A' }];
      const { sortedNodeIds } = parseDAG(nodes);
      expect(sortedNodeIds).toEqual(['A']);
    });
  });
});
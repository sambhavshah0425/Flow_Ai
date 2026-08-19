import { resolveVariables } from '../utils/variableResolver.js';

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

/**
 * Condition / If node — evaluates `left <operator> right` and picks a branch.
 * Both operands support {{template}} references, resolved against the run context.
 * Returns `branch: 'true' | 'false'`, which the execution engine uses to route
 * edges: nodes reachable only through the untaken handle are skipped.
 */
export async function conditionHandler(node, context) {
  const d = node.data || {};
  const operator = d.operator || 'contains';
  const left = resolveVariables(String(d.leftValue ?? d.left ?? ''), context);
  const right = resolveVariables(String(d.rightValue ?? d.right ?? ''), context);

  const ln = toNum(left);
  const rn = toNum(right);
  const truthy = ['true', '1', 'yes', 'y', 'on'];

  let result = false;
  switch (operator) {
    case 'equals': result = left === right; break;
    case 'not_equals': result = left !== right; break;
    case 'contains': result = left.includes(right); break;
    case 'not_contains': result = !left.includes(right); break;
    case 'starts_with': result = left.startsWith(right); break;
    case 'ends_with': result = left.endsWith(right); break;
    case 'gt': result = ln !== null && rn !== null && ln > rn; break;
    case 'gte': result = ln !== null && rn !== null && ln >= rn; break;
    case 'lt': result = ln !== null && rn !== null && ln < rn; break;
    case 'lte': result = ln !== null && rn !== null && ln <= rn; break;
    case 'is_empty': result = left.trim() === ''; break;
    case 'is_not_empty': result = left.trim() !== ''; break;
    case 'is_true': result = truthy.includes(left.trim().toLowerCase()); break;
    case 'is_false': result = !truthy.includes(left.trim().toLowerCase()); break;
    case 'regex':
      try { result = new RegExp(right).test(left); } catch { result = false; }
      break;
    default: result = false;
  }

  return {
    result,
    branch: result ? 'true' : 'false',
    left,
    right,
    operator,
    evaluatedAt: new Date().toISOString()
  };
}

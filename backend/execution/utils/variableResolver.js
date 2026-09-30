/**
 * Utility to resolve dynamic variables inside template strings.
 * Supports syntax like:
 *   {{secrets.KEY_NAME}}
 *   {{node_id.outputField}}
 *   {{node_id}} (returns full stringified/raw output)
 *   {{variables.varName}}
 */
export function resolveVariables(templateStr, context) {
  if (typeof templateStr !== 'string') {
    return templateStr;
  }

  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/g, (match, path) => {
    const parts = path.split('.');
    const domain = parts[0];

    // 1. Secrets domain: {{secrets.KEY}}
    if (domain === 'secrets') {
      const secretKey = parts[1];
      return context.secrets && context.secrets[secretKey] !== undefined
        ? context.secrets[secretKey]
        : match;
    }

    // 2. Global variables domain: {{variables.varName}}
    if (domain === 'variables') {
      const varName = parts[1];
      return context.variables && context.variables[varName] !== undefined
        ? context.variables[varName]
        : match;
    }

    // 3. Node outputs: {{nodeId.field}} or {{nodeLabel.field}} or {{nodeId}}
    const targetNodeOutput = context.getNodeOutput(domain);
    if (targetNodeOutput !== undefined && targetNodeOutput !== null) {
      if (parts.length === 1) {
        return typeof targetNodeOutput === 'object'
          ? JSON.stringify(targetNodeOutput)
          : String(targetNodeOutput);
      }
      
      const field = parts.slice(1).join('.');
      const value = getNestedProperty(targetNodeOutput, field);
      return value !== undefined ? (typeof value === 'object' ? JSON.stringify(value) : String(value)) : match;
    }

    // If unresolved, return original placeholder
    return match;
  });
}

/**
 * Lists the {{...}} references still present after resolution.
 *
 * resolveVariables deliberately leaves unknown references untouched so prompt
 * text degrades gracefully. That is wrong for connection-critical fields: a
 * raw "{{secrets.SMTP_HOST}}" handed to the network layer surfaces as
 * "getaddrinfo ENOTFOUND {{secrets.SMTP_HOST}}" instead of naming the secret
 * that was never set. Handlers use this to fail with an actionable message.
 */
export function findUnresolved(value) {
  const refs = [];
  const re = /\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(value ?? ''))) !== null) refs.push(m[1]);
  return refs;
}

function getNestedProperty(obj, propPath) {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = propPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = curr[p];
    } else {
      return undefined;
    }
  }
  return curr;
}

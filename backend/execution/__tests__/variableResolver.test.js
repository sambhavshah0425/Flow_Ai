import { describe, it, expect } from 'vitest';
import { resolveVariables } from '../utils/variableResolver.js';

// Minimal fake context matching what ExecutionContext provides
function makeContext({ secrets = {}, variables = {}, nodeOutputs = {} } = {}) {
  return {
    secrets,
    variables,
    getNodeOutput: (key) => nodeOutputs[key]
  };
}

describe('resolveVariables', () => {
  it('returns non-string input unchanged', () => {
    expect(resolveVariables(42, makeContext())).toBe(42);
    expect(resolveVariables(null, makeContext())).toBe(null);
    expect(resolveVariables(undefined, makeContext())).toBe(undefined);
  });

  it('returns a plain string with no placeholders unchanged', () => {
    const ctx = makeContext();
    expect(resolveVariables('just plain text', ctx)).toBe('just plain text');
  });

  describe('secrets domain', () => {
    it('resolves {{secrets.KEY}} to the secret value', () => {
      const ctx = makeContext({ secrets: { SMTP_PASS: 'abc123' } });
      expect(resolveVariables('key is {{secrets.SMTP_PASS}}', ctx)).toBe('key is abc123');
    });

    it('leaves the placeholder untouched if the secret does not exist', () => {
      const ctx = makeContext({ secrets: {} });
      expect(resolveVariables('{{secrets.MISSING}}', ctx)).toBe('{{secrets.MISSING}}');
    });
  });

  describe('variables domain', () => {
    it('resolves {{variables.name}} to the variable value', () => {
      const ctx = makeContext({ variables: { username: 'sambhav' } });
      expect(resolveVariables('hello {{variables.username}}', ctx)).toBe('hello sambhav');
    });

    it('leaves the placeholder untouched if the variable does not exist', () => {
      const ctx = makeContext({ variables: {} });
      expect(resolveVariables('{{variables.missing}}', ctx)).toBe('{{variables.missing}}');
    });
  });

  describe('node output domain', () => {
    it('resolves {{nodeId}} to the full stringified output when it is an object', () => {
      const ctx = makeContext({ nodeOutputs: { text_1: { text: 'hi', charCount: 2 } } });
      expect(resolveVariables('{{text_1}}', ctx)).toBe(JSON.stringify({ text: 'hi', charCount: 2 }));
    });

    it('resolves {{nodeId}} to a plain string when output is a primitive', () => {
      const ctx = makeContext({ nodeOutputs: { count_node: 5 } });
      expect(resolveVariables('{{count_node}}', ctx)).toBe('5');
    });

    it('resolves {{nodeId.field}} to a specific field of the output', () => {
      const ctx = makeContext({ nodeOutputs: { text_1: { text: 'hello world', charCount: 11 } } });
      expect(resolveVariables('{{text_1.text}}', ctx)).toBe('hello world');
    });

    it('resolves nested field paths like {{nodeId.a.b.c}}', () => {
      const ctx = makeContext({
        nodeOutputs: { api_1: { data: { user: { name: 'Sambhav' } } } }
      });
      expect(resolveVariables('{{api_1.data.user.name}}', ctx)).toBe('Sambhav');
    });

    it('leaves the placeholder untouched if the node output does not exist', () => {
      const ctx = makeContext({ nodeOutputs: {} });
      expect(resolveVariables('{{nonexistent_node.field}}', ctx)).toBe('{{nonexistent_node.field}}');
    });

    it('leaves the placeholder untouched if the field path does not resolve', () => {
      const ctx = makeContext({ nodeOutputs: { text_1: { text: 'hi' } } });
      expect(resolveVariables('{{text_1.missingField}}', ctx)).toBe('{{text_1.missingField}}');
    });
  });

  describe('multiple placeholders & mixed domains', () => {
    it('resolves multiple placeholders in the same string', () => {
      const ctx = makeContext({
        secrets: { API_KEY: 'key123' },
        nodeOutputs: { text_1: { text: 'world' } }
      });
      expect(resolveVariables('Hello {{text_1.text}}, key={{secrets.API_KEY}}', ctx))
        .toBe('Hello world, key=key123');
    });

    it('leaves unmatched placeholders untouched while resolving matched ones', () => {
      const ctx = makeContext({ nodeOutputs: { text_1: { text: 'hi' } } });
      expect(resolveVariables('{{text_1.text}} and {{unknown.thing}}', ctx))
        .toBe('hi and {{unknown.thing}}');
    });
  });
});
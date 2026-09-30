import { describe, it, expect } from 'vitest';
import { conditionHandler } from '../nodeHandlers/conditionHandler.js';

const ctx = (outputs = {}) => ({
  secrets: {},
  variables: {},
  getNodeOutput: (k) => outputs[k]
});

const run = (data, context = ctx()) => conditionHandler({ data }, context);

describe('conditionHandler', () => {
  it('contains → true / false', async () => {
    expect((await run({ leftValue: 'this is an invoice', operator: 'contains', rightValue: 'invoice' })).branch).toBe('true');
    expect((await run({ leftValue: 'a receipt', operator: 'contains', rightValue: 'invoice' })).branch).toBe('false');
  });

  it('equals and not_equals', async () => {
    expect((await run({ leftValue: '200', operator: 'equals', rightValue: '200' })).result).toBe(true);
    expect((await run({ leftValue: '200', operator: 'not_equals', rightValue: '404' })).result).toBe(true);
  });

  it('numeric comparisons', async () => {
    expect((await run({ leftValue: '12', operator: 'gt', rightValue: '5' })).result).toBe(true);
    expect((await run({ leftValue: '5', operator: 'gte', rightValue: '5' })).result).toBe(true);
    expect((await run({ leftValue: '3', operator: 'lt', rightValue: '5' })).result).toBe(true);
    expect((await run({ leftValue: 'abc', operator: 'gt', rightValue: '5' })).result).toBe(false); // non-numeric
  });

  it('unary operators', async () => {
    expect((await run({ leftValue: '', operator: 'is_empty' })).result).toBe(true);
    expect((await run({ leftValue: 'x', operator: 'is_not_empty' })).result).toBe(true);
    expect((await run({ leftValue: 'yes', operator: 'is_true' })).result).toBe(true);
    expect((await run({ leftValue: 'no', operator: 'is_false' })).result).toBe(true);
  });

  it('regex', async () => {
    expect((await run({ leftValue: 'user@x.io', operator: 'regex', rightValue: '^[^@]+@[^@]+$' })).result).toBe(true);
    expect((await run({ leftValue: 'nope', operator: 'regex', rightValue: '(' })).result).toBe(false); // invalid regex is safe
  });

  it('resolves {{template}} operands from context', async () => {
    const context = ctx({ ollama_1: { text: 'sentiment: negative' } });
    const out = await run({ leftValue: '{{ollama_1.text}}', operator: 'contains', rightValue: 'negative' }, context);
    expect(out.branch).toBe('true');
    expect(out.left).toBe('sentiment: negative');
  });
});

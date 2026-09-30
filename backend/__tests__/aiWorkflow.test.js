import { describe, it, expect } from 'vitest';
import {
  sanitizeAndValidateUrl,
  generateFallbackWorkflow,
  normalizeAndValidateWorkflow
} from '../controllers/aiWorkflowController.js';

describe('AI Workflow Controller Unit Tests', () => {
  describe('SSRF Protection & URL Sanitization', () => {
    it('allows safe public HTTP and HTTPS endpoints', () => {
      expect(sanitizeAndValidateUrl('https://api.github.com/users')).toBe('https://api.github.com/users');
      expect(sanitizeAndValidateUrl('http://jsonplaceholder.typicode.com/posts')).toBe('http://jsonplaceholder.typicode.com/posts');
    });

    it('allows dynamic template strings', () => {
      expect(sanitizeAndValidateUrl('{{variables.api_url}}')).toBe('{{variables.api_url}}');
    });

    it('blocks dangerous loopback and private IP hosts', () => {
      expect(sanitizeAndValidateUrl('http://localhost:5000/api')).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(sanitizeAndValidateUrl('http://127.0.0.1:8080/admin')).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(sanitizeAndValidateUrl('http://169.254.169.254/latest/meta-data')).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(sanitizeAndValidateUrl('http://192.168.1.10/internal')).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(sanitizeAndValidateUrl('http://10.0.0.5/secrets')).toBe('https://jsonplaceholder.typicode.com/posts/1');
    });

    it('handles empty or malformed URLs gracefully', () => {
      expect(sanitizeAndValidateUrl('')).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(sanitizeAndValidateUrl('invalid-url-string')).toBe('https://jsonplaceholder.typicode.com/posts/1');
    });
  });

  describe('Deterministic Fallback Pattern Matcher', () => {
    it('synthesizes API Summarizer pipeline for API-related prompts', () => {
      const wf = generateFallbackWorkflow('Fetch top posts from API and summarize them');
      expect(wf.nodes.length).toBe(3);
      expect(wf.nodes.map(n => n.type)).toEqual(['api', 'ollama', 'download']);
      expect(wf.edges.length).toBe(2);
    });

    it('synthesizes RAG Document Q&A pipeline for PDF prompts', () => {
      const wf = generateFallbackWorkflow('Ingest PDF document, embed and retrieve semantic answers');
      // The answer node must read the retrieve node's real output field
      expect(wf.nodes.find(n => n.type === 'ollama').data.prompt).toContain('{{retrieve_1.context}}');
      expect(wf.nodes.length).toBe(5);
      expect(wf.nodes.map(n => n.type)).toEqual(['pdf', 'embed', 'retrieve', 'ollama', 'download']);
      expect(wf.edges.length).toBe(4);
    });

    it('synthesizes Conditional Alert pipeline for email/condition prompts', () => {
      const wf = generateFallbackWorkflow('Check API status, if ok send email alert, otherwise wait');
      expect(wf.nodes.length).toBe(4);
      expect(wf.nodes.map(n => n.type)).toEqual(['api', 'condition', 'email', 'delay']);
      expect(wf.edges.some(e => e.sourceHandle === 'true')).toBe(true);
      expect(wf.edges.some(e => e.sourceHandle === 'false')).toBe(true);
    });

    it('synthesizes General Pipeline for general prompt', () => {
      const wf = generateFallbackWorkflow('Write a creative story about space exploration');
      expect(wf.nodes.length).toBe(3);
      expect(wf.nodes.map(n => n.type)).toEqual(['text', 'ollama', 'download']);
    });
  });

  describe('Schema Normalizer & DAG Validator', () => {
    it('normalizes valid raw workflow with proper coordinates and properties', () => {
      const raw = {
        name: 'Test Workflow',
        description: 'Testing normalization',
        nodes: [
          { id: 'input_node', type: 'text', data: { text: 'Hello' } },
          { id: 'ai_node', type: 'ollama', data: { prompt: 'Translate' } }
        ],
        edges: [
          { source: 'input_node', target: 'ai_node' }
        ]
      };

      const normalized = normalizeAndValidateWorkflow(raw);
      expect(normalized.name).toBe('Test Workflow');
      expect(normalized.nodes.length).toBe(2);
      expect(normalized.nodes[0].position.x).toBe(100);
      expect(normalized.nodes[1].position.x).toBe(450);
      expect(normalized.edges.length).toBe(1);
      expect(normalized.orderedNodes.map(n => n.id)).toEqual(['input_node', 'ai_node']);
    });

    it('throws error when cyclic dependency is present in raw workflow', () => {
      const cyclicRaw = {
        name: 'Cyclic Workflow',
        nodes: [
          { id: 'node_a', type: 'text' },
          { id: 'node_b', type: 'ollama' }
        ],
        edges: [
          { source: 'node_a', target: 'node_b' },
          { source: 'node_b', target: 'node_a' }
        ]
      };

      expect(() => normalizeAndValidateWorkflow(cyclicRaw)).toThrow(/Circular dependency/i);
    });

    it('converts legacy gemini nodes to the local AI node', () => {
      const normalized = normalizeAndValidateWorkflow({
        nodes: [{ id: 'ai', type: 'gemini', data: { prompt: 'hi', model: 'gemini-flash-latest' } }],
        edges: []
      });
      expect(normalized.nodes[0].type).toBe('ollama');
      expect(normalized.nodes[0].data.model).toBeUndefined();
    });

    it('throws error when workflow has no nodes', () => {
      expect(() => normalizeAndValidateWorkflow({ nodes: [] })).toThrow(/no nodes/i);
    });
  });
});

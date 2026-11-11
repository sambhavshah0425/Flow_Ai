import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stand-in for the local Ollama server: each test sets what the "model" replies.
const ollamaChat = vi.fn();
const ollamaWarmup = vi.fn();
vi.mock('../utils/ollamaClient.js', async () => {
  const actual = await vi.importActual('../utils/ollamaClient.js');
  return {
    ollamaChat: (...args) => ollamaChat(...args),
    ollamaWarmup: (...args) => ollamaWarmup(...args),
    ollamaStatus: async () => ({ online: true, model: 'qwen3:1.7b', modelInstalled: true, models: ['qwen3:1.7b'] }),
    getOllamaModel: () => 'qwen3:1.7b',
    parseJsonResponse: actual.parseJsonResponse
  };
});

const {
  copilotChat,
  copilotWarmup,
  autoLayout,
  summarizeCanvas,
  checkEmailRecipients,
  stripRedundantTextSinks,
  EMAIL_QUESTION,
  SYSTEM_PROMPT
} = await import('../controllers/copilotController.js');

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((body) => { res.body = body; return res; });
  return res;
}

const ask = (content, extra = {}) => ({ body: { messages: [{ role: 'user', content }], ...extra } });
const modelSays = (obj) => ollamaChat.mockResolvedValueOnce({ text: JSON.stringify(obj), model: 'qwen3:1.7b' });

beforeEach(() => ollamaChat.mockReset());

describe('copilotChat', () => {
  it('passes a clarifying question straight through', async () => {
    modelSays({ action: 'ask', reply: 'Which email address should I send it to?' });
    const res = mockRes();
    await copilotChat(ask('Email me a daily summary'), res);
    expect(res.body).toMatchObject({ success: true, action: 'ask', reply: 'Which email address should I send it to?' });
    expect(res.body.workflow).toBeUndefined();
  });

  it('returns a normalized, laid-out workflow on build', async () => {
    modelSays({
      action: 'build',
      reply: 'Built it!',
      workflow: {
        name: 'Summarize',
        nodes: [
          { id: 'text_1', type: 'text', data: { label: 'Input', text: 'hello' } },
          { id: 'ollama_1', type: 'ollama', data: { label: 'AI', prompt: 'Summarize {{text_1.text}}' } }
        ],
        edges: [{ source: 'text_1', target: 'ollama_1' }]
      }
    });
    const res = mockRes();
    await copilotChat(ask('Summarize some text'), res);

    expect(res.body.action).toBe('build');
    const { nodes, edges } = res.body.workflow;
    expect(nodes.map((n) => n.type)).toEqual(['text', 'ollama']); // ollama is a valid type, not coerced to text
    expect(nodes[1].position.x).toBeGreaterThan(nodes[0].position.x); // left-to-right layout
    expect(edges).toHaveLength(1);
  });

  it('sends the model a JSON schema and the current canvas', async () => {
    modelSays({ action: 'ask', reply: 'ok?' });
    await copilotChat(
      ask('add an email step', { currentWorkflow: { name: 'W', nodes: [{ id: 'text_1', type: 'text', data: { text: 'x' } }], edges: [] } }),
      mockRes()
    );
    const call = ollamaChat.mock.calls[0][0];
    expect(call.format.properties.action.enum).toEqual(['ask', 'build']);
    expect(call.messages.some((m) => m.content.includes('Current workflow on the canvas'))).toBe(true);
  });

  it('turns an invalid (cyclic) workflow into a friendly retry question', async () => {
    modelSays({
      action: 'build',
      reply: 'Built!',
      workflow: {
        name: 'Loop',
        nodes: [{ id: 'a_1', type: 'text', data: {} }, { id: 'b_1', type: 'text', data: {} }],
        edges: [{ source: 'a_1', target: 'b_1' }, { source: 'b_1', target: 'a_1' }]
      }
    });
    const res = mockRes();
    await copilotChat(ask('do a thing'), res);
    expect(res.body.action).toBe('ask');
    expect(res.body.reply).toMatch(/valid workflow/i);
  });

  it('handles non-JSON model output without crashing', async () => {
    ollamaChat.mockResolvedValueOnce({ text: 'not json at all', model: 'qwen3:1.7b' });
    const res = mockRes();
    await copilotChat(ask('hi'), res);
    expect(res.body).toMatchObject({ success: true, action: 'ask' });
  });

  it('returns 503 with setup instructions when Ollama is offline', async () => {
    ollamaChat.mockRejectedValueOnce(new Error("Can't reach Ollama at http://localhost:11434 ... ollama pull qwen3:1.7b"));
    const res = mockRes();
    await copilotChat(ask('hi'), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.message).toMatch(/ollama pull/);
  });

  it('rejects malformed message lists', async () => {
    const res = mockRes();
    await copilotChat({ body: { messages: [{ role: 'system', content: 'x' }] } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(ollamaChat).not.toHaveBeenCalled();
  });

  it('recovers fenced/prose-wrapped JSON and handles conversational empty-workflow replies cleanly', async () => {
    ollamaChat.mockResolvedValueOnce({
      text: 'Here you go:\n```json\n{"action":"build","reply":"Hello! What workflow can I help you build today?","workflow":{"name":"","nodes":[],"edges":[]}}\n```',
      model: 'qwen3:1.7b'
    });
    const res = mockRes();
    await copilotChat(ask('hi there'), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toMatchObject({
      success: true,
      action: 'ask',
      reply: 'Hello! What workflow can I help you build today?'
    });
  });

  it('handles multi-turn histories longer than 20 messages by sliding context cleanly', async () => {
    modelSays({ action: 'ask', reply: 'Still here!' });
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}`
    }));
    const res = mockRes();
    await copilotChat({ body: { messages: history } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.reply).toBe('Still here!');
    // System prompt + last 12 messages sent to Ollama
    expect(ollamaChat.mock.calls[0][0].messages).toHaveLength(13);
  });
});

describe('copilotWarmup', () => {
  it('replies immediately and pre-reads the system prompt only once at a time', async () => {
    let finish;
    ollamaWarmup.mockReset().mockReturnValue(new Promise((r) => { finish = r; }));

    const res1 = mockRes();
    const res2 = mockRes();
    await copilotWarmup({}, res1); // must not wait for the (slow) model
    await copilotWarmup({}, res2); // second call while the first is still running

    expect(res1.status).toHaveBeenCalledWith(202);
    expect(res2.status).toHaveBeenCalledWith(202);
    expect(ollamaWarmup).toHaveBeenCalledTimes(1);
    expect(ollamaWarmup).toHaveBeenCalledWith(SYSTEM_PROMPT);
    finish(true);
  });
});

describe('email recipient guard', () => {
  const pdfEmailWorkflow = (to) => ({
    action: 'build',
    reply: 'Done!',
    workflow: {
      name: 'PDF Email',
      nodes: [
        { id: 'pdf_1', type: 'pdf', data: { label: 'PDF' } },
        { id: 'email_1', type: 'email', data: { label: 'Mail', to, subject: 's', body: '{{pdf_1.text}}' } }
      ],
      edges: [{ source: 'pdf_1', target: 'email_1' }]
    }
  });

  it('asks for the address instead of accepting an invented one', async () => {
    modelSays(pdfEmailWorkflow('user@example.com'));
    const res = mockRes();
    await copilotChat(ask('Summarize a PDF and email me the summary'), res);
    expect(res.body).toMatchObject({ action: 'ask', reply: EMAIL_QUESTION });
  });

  it("replaces a hallucinated address with the one the user typed", async () => {
    modelSays(pdfEmailWorkflow('user@example.com'));
    const res = mockRes();
    await copilotChat({
      body: {
        messages: [
          { role: 'user', content: 'Summarize a PDF and email me' },
          { role: 'assistant', content: EMAIL_QUESTION },
          { role: 'user', content: 'sam@gmail.com' }
        ]
      }
    }, res);
    expect(res.body.action).toBe('build');
    expect(res.body.workflow.nodes.find((n) => n.type === 'email').data.to).toBe('sam@gmail.com');
  });

  it('builds with a blank recipient if the user was already asked and gave none', () => {
    const wf = { nodes: [{ id: 'email_1', type: 'email', data: { to: 'user@example.com' } }] };
    const messages = [
      { role: 'user', content: 'email me a summary' },
      { role: 'assistant', content: EMAIL_QUESTION },
      { role: 'user', content: 'just build it' }
    ];
    expect(checkEmailRecipients(wf, messages)).toBe('ok');
    expect(wf.nodes[0].data.to).toBe('');
  });

  it('accepts {{template}} recipients and addresses already on the canvas', () => {
    const msgs = [{ role: 'user', content: 'add a subject line' }];
    expect(checkEmailRecipients({ nodes: [{ type: 'email', data: { to: '{{text_1.text}}' } }] }, msgs)).toBe('ok');
    expect(checkEmailRecipients(
      { nodes: [{ type: 'email', data: { to: 'me@x.io' } }] },
      msgs,
      { nodes: [{ type: 'email', data: { to: 'me@x.io' } }] }
    )).toBe('ok');
  });
});

describe('autoLayout', () => {
  it('puts true/false branches in the same column at different heights', () => {
    const nodes = [{ id: 'c' }, { id: 't' }, { id: 'f' }];
    const edges = [{ source: 'c', target: 't' }, { source: 'c', target: 'f' }];
    const [c, t, f] = autoLayout(nodes, edges);
    expect(t.position.x).toBe(f.position.x);
    expect(t.position.x).toBeGreaterThan(c.position.x);
    expect(t.position.y).not.toBe(f.position.y);
  });
});

describe('summarizeCanvas', () => {
  it('trims long strings and hides SMTP fields', () => {
    const s = summarizeCanvas({
      nodes: [{ id: 'email_1', type: 'email', data: { to: 'a@b.c', smtpPass: '{{secrets.SMTP_PASS}}', body: 'x'.repeat(500) } }],
      edges: []
    });
    expect(s.nodes[0].data.smtpPass).toBeUndefined();
    expect(s.nodes[0].data.body.length).toBeLessThan(310);
  });

  it('returns null for an empty canvas', () => {
    expect(summarizeCanvas({ nodes: [] })).toBeNull();
  });
});

describe('small-model consistency guards', () => {
  it('forces action ask when a question reply is mislabeled as build with hallucinated nodes', async () => {
    modelSays({
      action: 'build',
      reply: 'I can help you automate APIs, AI summaries, and emails. What would you like to build?',
      workflow: {
        name: 'Phantom RAG',
        nodes: [{ id: 'pdf_1', type: 'pdf', data: { label: 'PDF' } }],
        edges: []
      }
    });
    const res = mockRes();
    await copilotChat(ask('Hi! What can you help me build?'), res);
    expect(res.body).toMatchObject({
      success: true,
      action: 'ask',
      reply: 'I can help you automate APIs, AI summaries, and emails. What would you like to build?'
    });
    expect(res.body.workflow).toBeUndefined();
  });

  it('drops trailing downstream text sinks and bypasses pass-through text aliases while keeping root text inputs', async () => {
    modelSays({
      action: 'build',
      reply: 'Built it: summarizes the post and saves a file.',
      workflow: {
        name: 'API Summary',
        nodes: [
          { id: 'api_1', type: 'api', data: { label: 'Fetch', url: 'https://example.com', method: 'GET' } },
          { id: 'ollama_1', type: 'ollama', data: { label: 'Summarize', prompt: '{{api_1.data}}' } },
          { id: 'text_1', type: 'text', data: { label: 'Summary holder', text: '{{ollama_1.text}}' } },
          { id: 'download_1', type: 'download', data: { label: 'Save', fileName: 'out.txt', text: '{{text_1.text}}' } },
          { id: 'text_2', type: 'text', data: { label: 'Extra note', text: '{{download_1.text}}' } }
        ],
        edges: [
          { source: 'api_1', target: 'ollama_1' },
          { source: 'ollama_1', target: 'text_1' },
          { source: 'text_1', target: 'download_1' },
          { source: 'download_1', target: 'text_2' }
        ]
      }
    });
    const res = mockRes();
    await copilotChat(ask('Fetch https://example.com, summarize it, and download the file'), res);
    expect(res.body.action).toBe('build');
    expect(res.body.workflow.nodes.map((n) => n.id)).toEqual(['api_1', 'ollama_1', 'download_1']);
    expect(res.body.workflow.edges.map((e) => ({ source: e.source, target: e.target }))).toEqual([
      { source: 'api_1', target: 'ollama_1' },
      { source: 'ollama_1', target: 'download_1' }
    ]);
    expect(res.body.workflow.edges.every((e) => e.id && e.type === 'smoothstep')).toBe(true);
    expect(res.body.workflow.nodes.find((n) => n.id === 'download_1').data.text).toBe('{{ollama_1.text}}');

    // Genuine root text input nodes (inEdges = 0) are untouched
    const rag = stripRedundantTextSinks({
      name: 'RAG',
      nodes: [
        { id: 'pdf_1', type: 'pdf', data: {} },
        { id: 'text_1', type: 'text', data: { text: 'Question?' } },
        { id: 'retrieve_1', type: 'retrieve', data: { query: '{{text_1.text}}' } }
      ],
      edges: [
        { source: 'pdf_1', target: 'retrieve_1' },
        { source: 'text_1', target: 'retrieve_1' }
      ]
    });
    expect(rag.nodes.map((n) => n.id)).toEqual(['pdf_1', 'text_1', 'retrieve_1']);
  });
});

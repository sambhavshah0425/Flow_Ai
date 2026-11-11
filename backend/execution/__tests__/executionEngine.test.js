import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbState = { connected: true };
const ExecutionMock = {
  create: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn()
};
const LogMock = {
  create: vi.fn(),
  find: vi.fn()
};
const WorkflowMock = {
  findOne: vi.fn()
};
const emitMock = vi.fn();

vi.mock('../../config/db.js', () => ({ isDBConnected: () => dbState.connected }));
vi.mock('../../models/Execution.js', () => ({ Execution: ExecutionMock }));
vi.mock('../../models/Log.js', () => ({ Log: LogMock }));
vi.mock('../../models/Workflow.js', () => ({ Workflow: WorkflowMock }));
vi.mock('../../controllers/secretController.js', () => ({ getDecryptedUserSecrets: vi.fn(async () => ({})) }));
vi.mock('../../socket/socketServer.js', () => ({
  emitExecutionEvent: (...args) => emitMock(...args),
  registerExecutionStarter: vi.fn(),
  registerExecutionAuthorizer: vi.fn()
}));

const {
  prepareExecution,
  authorizeExecutionUser,
  executeWorkflow,
  memoryExecutions,
  pendingExecutions
} = await import('../executionEngine.js');
const { runWorkflow, getUserExecutions, getExecutionById } = await import('../../controllers/executionController.js');

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((body) => { res.body = body; return res; });
  return res;
}

describe('Execution Engine & Controller — unsaved canvas + all core node types', () => {
  beforeEach(() => {
    dbState.connected = true;
    memoryExecutions.clear();
    pendingExecutions.clear();
    vi.clearAllMocks();
  });

  it('authorizes in-memory exec_ runs for owner even when DB is connected', async () => {
    const ownerId = '6af4689909c079ff443297b4';
    const otherId = '6af4689909c079ff443297b5';
    const workflow = {
      name: 'Unsaved Copilot Workflow',
      nodes: [
        { id: 'text_1', type: 'text', data: { label: 'Prompt', text: 'hello' } },
        { id: 'download_1', type: 'download', data: { fileName: 'out.txt', text: '{{text_1.text}}' } }
      ],
      edges: [{ id: 'e1', source: 'text_1', target: 'download_1' }]
    };

    const { executionId } = await prepareExecution(workflow, ownerId);
    expect(executionId).toMatch(/^exec_/);
    // Must not attempt an invalid ObjectId write to MongoDB
    expect(ExecutionMock.create).not.toHaveBeenCalled();

    expect(await authorizeExecutionUser(executionId, ownerId)).toBe(true);
    expect(await authorizeExecutionUser(executionId, otherId)).toBe(false);
    expect(ExecutionMock.findById).not.toHaveBeenCalled();
  });

  it('runs text, pdf, condition (branch + skip), delay, embed, retrieve, and download nodes cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'model not found' }));
    try {
      const workflow = {
        name: 'Multi-Node Core Check',
        nodes: [
          { id: 'text_1', type: 'text', data: { label: 'Question', text: 'quarterly revenue target' } },
          { id: 'pdf_1', type: 'pdf', data: { label: 'Doc', text: 'Q3 quarterly revenue exceeded the 12M target by 18 percent.' } },
          { id: 'embed_1', type: 'embed', data: { label: 'Index', text: '{{pdf_1.text}}' } },
          { id: 'retrieve_1', type: 'retrieve', data: { label: 'Search', query: '{{text_1.text}}', topK: 1 } },
          { id: 'condition_1', type: 'condition', data: { label: 'Found?', leftValue: '{{retrieve_1.context}}', operator: 'contains', rightValue: '12M target' } },
          { id: 'delay_1', type: 'delay', data: { label: 'Wait', delayMs: 5 } },
          { id: 'download_1', type: 'download', data: { label: 'Save', fileName: 'hit.txt', text: '{{retrieve_1.context}}' } },
          { id: 'text_skip', type: 'text', data: { label: 'Fallback', text: 'not found' } }
        ],
        edges: [
          { id: 'e1', source: 'pdf_1', target: 'embed_1' },
          { id: 'e2', source: 'embed_1', target: 'retrieve_1' },
          { id: 'e3', source: 'text_1', target: 'retrieve_1' },
          { id: 'e4', source: 'retrieve_1', target: 'condition_1' },
          { id: 'e5', source: 'condition_1', target: 'delay_1', sourceHandle: 'true' },
          { id: 'e6', source: 'delay_1', target: 'download_1' },
          { id: 'e7', source: 'condition_1', target: 'text_skip', sourceHandle: 'false' }
        ]
      };

      const ctx = await executeWorkflow(workflow, '6af4689909c079ff443297b4');
      expect(ctx.status).toBe('completed');
      expect(ctx.metrics.nodesExecuted).toBe(7); // 8 total minus 1 skipped false branch
      expect(ctx.getNodeOutput('condition_1').branch).toBe('true');
      expect(ctx.getNodeOutput('download_1').content).toContain('12M target');
      expect(ctx.getNodeOutput('text_skip')).toBeUndefined();
      expect(emitMock).toHaveBeenCalledWith(expect.any(String), 'node.skipped', expect.objectContaining({ nodeId: 'text_skip' }));
      expect(emitMock).toHaveBeenCalledWith(expect.any(String), 'workflow.completed', expect.objectContaining({ status: 'completed' }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('serves in-memory execution history and details without ObjectId CastErrors when DB is connected', async () => {
    const userId = '6af4689909c079ff443297b4';
    const spoofedWorkflowId = '507f1f77bcf86cd799439011';
    WorkflowMock.findOne.mockResolvedValueOnce(null);

    const runRes = mockRes();
    await runWorkflow(
      {
        user: { _id: userId },
        body: {
          workflowId: 'wf_unsaved_client_id',
          workflowData: {
            _id: spoofedWorkflowId, // must be ignored if user doesn't own it
            name: 'Canvas Flow',
            nodes: [{ id: 'text_1', type: 'text', data: { text: 'ok' } }],
            edges: []
          }
        }
      },
      runRes
    );

    expect(runRes.status).toHaveBeenCalledWith(202);
    const { executionId } = runRes.body;
    expect(executionId).toMatch(/^exec_/);

    ExecutionMock.find.mockReturnValueOnce({
      populate: () => ({
        sort: () => ({
          limit: async () => []
        })
      })
    });
    const listRes = mockRes();
    await getUserExecutions({ user: { _id: userId } }, listRes);
    expect(listRes.status).toHaveBeenCalledWith(200);
    expect(listRes.body.executions.some((e) => e._id === executionId)).toBe(true);

    const detailRes = mockRes();
    await getExecutionById({ user: { _id: userId }, params: { id: executionId } }, detailRes);
    expect(detailRes.status).toHaveBeenCalledWith(200);
    expect(detailRes.body.execution._id).toBe(executionId);

    const missingRes = mockRes();
    await getExecutionById({ user: { _id: userId }, params: { id: 'not_an_object_id' } }, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });
});


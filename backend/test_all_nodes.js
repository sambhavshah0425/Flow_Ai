import './config/loadEnv.js';
import nodemailer from 'nodemailer';
import { executeWorkflow } from './execution/executionEngine.js';

// Mock SMTP Transporter for the Email node test
nodemailer.createTransport = (config) => {
  console.log('[Mock SMTP] createTransport called with config:', JSON.stringify(config, null, 2));
  return {
    sendMail: async (mailOpts) => {
      console.log('[Mock SMTP] sendMail called with options:', JSON.stringify(mailOpts, null, 2));
      return {
        messageId: 'mock_message_id_12345',
        accepted: [mailOpts.to],
        rejected: []
      };
    }
  };
};

async function runAllNodesTest() {
  console.log('=======================================================');
  console.log(' Starting End-To-End Test Pipeline For All 10 Node Types');
  console.log('=======================================================');

  const testWorkflow = {
    _id: 'test_wf_all_10',
    name: 'Full All-Nodes Pipeline Test',
    nodes: [
      {
        id: 'text_node',
        type: 'text',
        data: { text: 'FlowForge OS visual orchestration pipeline trigger.' }
      },
      {
        id: 'pdf_node',
        type: 'pdf',
        data: { text: 'PDF content: Deep Learning Workflow Systems.', fileName: 'sample.pdf', pageCount: 2 }
      },
      {
        id: 'delay_node',
        type: 'delay',
        data: { delayMs: 150 }
      },
      {
        id: 'api_node',
        type: 'api',
        data: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' }
      },
      {
        id: 'embed_node',
        type: 'embed',
        data: { text: '{{pdf_node.text}}', chunkSize: 100 }
      },
      {
        id: 'retrieve_node',
        type: 'retrieve',
        data: { query: 'workflow', topK: 1 }
      },
      {
        id: 'condition_node',
        type: 'condition',
        data: { operator: 'contains', left: '{{text_node.text}}', right: 'visual' }
      },
      {
        id: 'gemini_node',
        type: 'gemini',
        data: { prompt: 'Summarize the retrieve context output: {{retrieve_node.context}}', model: 'gemini-flash-latest' }
      },
      {
        id: 'download_node',
        type: 'download',
        data: { text: '{{gemini_node.text}}', fileName: 'pipeline_summary.txt' }
      },
      {
        id: 'email_node',
        type: 'email',
        data: {
          to: 'developer@flowforge.com',
          subject: 'Pipeline Run Complete Notification',
          body: 'Result summary: {{download_node.content}}',
          smtpHost: 'smtp.mockserver.com',
          smtpPort: '587',
          smtpUser: 'mockuser',
          smtpPass: 'mockpass'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'text_node', target: 'pdf_node' },
      { id: 'e2', source: 'pdf_node', target: 'delay_node' },
      { id: 'e3', source: 'delay_node', target: 'api_node' },
      { id: 'e4', source: 'api_node', target: 'embed_node' },
      { id: 'e5', source: 'embed_node', target: 'retrieve_node' },
      { id: 'e6', source: 'retrieve_node', target: 'condition_node' },
      { id: 'e7', source: 'condition_node', target: 'gemini_node' },
      { id: 'e8', source: 'gemini_node', target: 'download_node' },
      { id: 'e9', source: 'download_node', target: 'email_node' }
    ]
  };

  const startTime = Date.now();
  const context = await executeWorkflow(testWorkflow, null);
  const totalDuration = Date.now() - startTime;

  console.log('\n=======================================================');
  console.log('                   EXECUTION RESULT');
  console.log('=======================================================');
  console.log('Status:', context.status);
  console.log('Total Time:', totalDuration, 'ms');
  console.log('Nodes Executed:', context.metrics.nodesExecuted);
  console.log('Tokens Used:', context.metrics.tokensUsed);
  console.log('Retry Count:', context.metrics.retryCount);
  console.log('\n--- Individual Node Verification ---');

  const nodeStatus = {};
  for (const node of testWorkflow.nodes) {
    const output = context.nodeOutputs[node.id];
    if (output) {
      console.log(`🟢 [PASS] Node: ${node.id} (${node.type})`);
      nodeStatus[node.type] = 'working';
    } else {
      console.log(`🔴 [FAIL] Node: ${node.id} (${node.type})`);
      nodeStatus[node.type] = 'failed';
    }
  }

  console.log('\n--- Logs Captured During Execution ---');
  context.logs.forEach(log => {
    console.log(`[${log.nodeId}] [${log.level.toUpperCase()}] ${log.message}`);
  });

  console.log('\n=======================================================');
  console.log(' Summary Matrix of Node Types Working:');
  console.log(JSON.stringify(nodeStatus, null, 2));
  console.log('=======================================================');
}

runAllNodesTest().catch(console.error);

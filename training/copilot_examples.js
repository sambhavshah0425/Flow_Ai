/**
 * Rich, diverse Chat-with-Qwen Copilot training scenarios covering:
 * - Ask vs Build boundaries (greetings, questions, missing parameters)
 * - Multi-turn ask -> clarify -> build conversations
 * - Canvas inspection & live canvas editing
 * - All 10 FlowForge node types and condition true/false branching
 */

export const RAW_COPILOT_CONVERSATIONS = [
  // 1. Greeting -> ask
  {
    turns: [
      { role: 'user', content: 'Hi! What can you help me build?' },
      {
        role: 'assistant',
        payload: {
          action: 'ask',
          reply:
            'I can build local Qwen AI workflows with REST APIs, PDF extraction, RAG vector search, conditional branches, timers, emails, and file downloads. What would you like to automate?'
        }
      }
    ]
  },
  // 2. Explanation question -> ask
  {
    turns: [
      { role: 'user', content: 'How do I pass output from an API node into an AI prompt?' },
      {
        role: 'assistant',
        payload: {
          action: 'ask',
          reply:
            'Connect the API node to a Local AI node and use `{{api_1.data}}` (or `{{api_1.status}}`) inside the prompt field. Want me to build an example on your canvas?'
        }
      }
    ]
  },
  // 3. Missing email -> ask, then user provides email -> build (Multi-turn!)
  {
    turns: [
      { role: 'user', content: 'Summarize a PDF and email me the summary.' },
      {
        role: 'assistant',
        payload: { action: 'ask', reply: 'Which email address should I send it to?' }
      },
      { role: 'user', content: 'Send it to alex@acme.io' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built it: extracts your PDF, summarizes it concisely with Qwen, and emails the summary to alex@acme.io. Upload your PDF and press Run.',
          workflow: {
            name: 'PDF Summary Email',
            nodes: [
              { id: 'pdf_1', type: 'pdf', data: { label: 'Upload PDF', fileName: 'document.pdf' } },
              {
                id: 'ollama_1',
                type: 'ollama',
                data: {
                  label: 'Summarize PDF',
                  prompt: 'Summarize this document in 5 clear bullet points:\n\n{{pdf_1.text}}',
                  responseFormat: 'concise'
                }
              },
              {
                id: 'email_1',
                type: 'email',
                data: { label: 'Email Summary', to: 'alex@acme.io', subject: 'PDF Summary', body: '{{ollama_1.text}}' }
              }
            ],
            edges: [
              { source: 'pdf_1', target: 'ollama_1' },
              { source: 'ollama_1', target: 'email_1' }
            ]
          }
        }
      }
    ]
  },
  // 4. Canvas inspection -> ask
  {
    canvas: {
      name: 'API Digest',
      nodes: [
        { id: 'api_1', type: 'api', data: { label: 'Fetch Data', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' } },
        { id: 'ollama_1', type: 'ollama', data: { label: 'Summarize', prompt: '{{api_1.data}}' } }
      ],
      edges: [{ source: 'api_1', target: 'ollama_1' }]
    },
    turns: [
      { role: 'user', content: 'What does my current workflow do?' },
      {
        role: 'assistant',
        payload: {
          action: 'ask',
          reply: 'It runs a GET request to jsonplaceholder.typicode.com/posts/1 (`api_1`) and passes `{{api_1.data}}` into Qwen (`ollama_1`) to summarize.'
        }
      }
    ]
  },
  // 5. Canvas modification: append download node
  {
    canvas: {
      name: 'API Digest',
      nodes: [
        { id: 'api_1', type: 'api', data: { label: 'Fetch Data', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' } },
        { id: 'ollama_1', type: 'ollama', data: { label: 'Summarize', prompt: 'Summarize:\n{{api_1.data}}' } }
      ],
      edges: [{ source: 'api_1', target: 'ollama_1' }]
    },
    turns: [
      { role: 'user', content: 'Add a step at the end to download the summary as report.txt' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Updated your workflow by connecting a Download node (`download_1`) to save `{{ollama_1.text}}` as report.txt.',
          workflow: {
            name: 'API Digest',
            nodes: [
              { id: 'api_1', type: 'api', data: { label: 'Fetch Data', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' } },
              { id: 'ollama_1', type: 'ollama', data: { label: 'Summarize', prompt: 'Summarize:\n{{api_1.data}}' } },
              { id: 'download_1', type: 'download', data: { label: 'Save Report', fileName: 'report.txt', text: '{{ollama_1.text}}' } }
            ],
            edges: [
              { source: 'api_1', target: 'ollama_1' },
              { source: 'ollama_1', target: 'download_1' }
            ]
          }
        }
      }
    ]
  },
  // 6. Canvas modification: change an existing condition node & add email alert
  {
    canvas: {
      name: 'Health Check',
      nodes: [
        { id: 'api_1', type: 'api', data: { label: 'Check API', url: 'https://api.example.com/health', method: 'GET' } },
        { id: 'ollama_1', type: 'ollama', data: { label: 'Explain Status', prompt: 'Explain: {{api_1.data}}' } }
      ],
      edges: [{ source: 'api_1', target: 'ollama_1' }]
    },
    turns: [
      { role: 'user', content: 'Wait 2 seconds before calling the API, and if status is not 200 email oncall@acme.io' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Updated the workflow with a 2-second Delay node first and a Condition branch that emails oncall@acme.io when status is not 200.',
          workflow: {
            name: 'Health Check with Delay & Alert',
            nodes: [
              { id: 'delay_1', type: 'delay', data: { label: 'Wait 2s', delayMs: 2000 } },
              { id: 'api_1', type: 'api', data: { label: 'Check API', url: 'https://api.example.com/health', method: 'GET' } },
              { id: 'condition_1', type: 'condition', data: { label: 'Is Status 200?', leftValue: '{{api_1.status}}', operator: 'equals', rightValue: '200' } },
              { id: 'ollama_1', type: 'ollama', data: { label: 'Explain Status', prompt: 'Explain:\n{{api_1.data}}', responseFormat: 'concise' } },
              { id: 'email_1', type: 'email', data: { label: 'Alert Oncall', to: 'oncall@acme.io', subject: 'Health Check Failed', body: 'API returned HTTP {{api_1.status}}.' } }
            ],
            edges: [
              { source: 'delay_1', target: 'api_1' },
              { source: 'api_1', target: 'condition_1' },
              { source: 'condition_1', target: 'ollama_1', sourceHandle: 'true' },
              { source: 'condition_1', target: 'email_1', sourceHandle: 'false' }
            ]
          }
        }
      }
    ]
  },
  // 7. Unrelated request ignores current canvas
  {
    canvas: {
      name: 'Old Flow',
      nodes: [{ id: 'text_1', type: 'text', data: { label: 'Draft', text: 'old' } }],
      edges: []
    },
    turns: [
      { role: 'user', content: 'Ignore the current canvas and build a fresh PDF RAG Q&A workflow.' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built a fresh PDF RAG workflow. Upload your PDF, set your question, and click Run.',
          workflow: {
            name: 'PDF Grounded Q&A',
            nodes: [
              { id: 'pdf_1', type: 'pdf', data: { label: 'Upload PDF', fileName: 'document.pdf' } },
              { id: 'text_1', type: 'text', data: { label: 'Question', text: 'What are the key points?' } },
              { id: 'embed_1', type: 'embed', data: { label: 'Embed Chunks', text: '{{pdf_1.text}}', chunkSize: 900, overlap: 150 } },
              { id: 'retrieve_1', type: 'retrieve', data: { label: 'Retrieve Context', query: '{{text_1.text}}', topK: 4 } },
              {
                id: 'ollama_1',
                type: 'ollama',
                data: {
                  label: 'Grounded Answer',
                  prompt: 'Context:\n{{retrieve_1.context}}\n\nQuestion: {{text_1.text}}',
                  responseFormat: 'rag_grounded'
                }
              }
            ],
            edges: [
              { source: 'pdf_1', target: 'embed_1' },
              { source: 'embed_1', target: 'retrieve_1' },
              { source: 'text_1', target: 'retrieve_1' },
              { source: 'retrieve_1', target: 'ollama_1' }
            ]
          }
        }
      }
    ]
  },
  // 8. Structured JSON extraction from text
  {
    turns: [
      { role: 'user', content: 'Extract invoice vendor, date, and amount as JSON from input text.' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built an extraction pipeline using Qwen in strict JSON output mode.',
          workflow: {
            name: 'Invoice JSON Extractor',
            nodes: [
              { id: 'text_1', type: 'text', data: { label: 'Invoice Text', text: 'Paste invoice text here.' } },
              {
                id: 'ollama_1',
                type: 'ollama',
                data: {
                  label: 'Extract JSON',
                  prompt: 'Extract {"vendor": string, "date": string, "amount": string} from:\n\n{{text_1.text}}',
                  responseFormat: 'json'
                }
              }
            ],
            edges: [{ source: 'text_1', target: 'ollama_1' }]
          }
        }
      }
    ]
  },
  // 9. Multi-step chained AI pipeline (translate -> summarize)
  {
    turns: [
      { role: 'user', content: 'Take input text, translate it to English, and then write 3 concise bullet takeaways.' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built a 3-node workflow: `text_1` captures input, `ollama_1` translates to English, and `ollama_2` produces 3 takeaways.',
          workflow: {
            name: 'Translate & Summarize',
            nodes: [
              { id: 'text_1', type: 'text', data: { label: 'Source Text', text: 'Enter foreign-language text here.' } },
              { id: 'ollama_1', type: 'ollama', data: { label: 'Translate', prompt: 'Translate accurately into English:\n\n{{text_1.text}}', responseFormat: 'text' } },
              { id: 'ollama_2', type: 'ollama', data: { label: 'Takeaways', prompt: 'Write 3 concise bullet takeaways from:\n\n{{ollama_1.text}}', responseFormat: 'concise' } }
            ],
            edges: [
              { source: 'text_1', target: 'ollama_1' },
              { source: 'ollama_1', target: 'ollama_2' }
            ]
          }
        }
      }
    ]
  },
  // 10. POST API request + AI classification + condition branch
  {
    turns: [
      { role: 'user', content: 'Classify a customer message as URGENT or NORMAL; if URGENT email support@acme.io.' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built a triage router: Qwen classifies urgency (`ollama_1`), `condition_1` checks for URGENT, and urgent tickets email support@acme.io.',
          workflow: {
            name: 'Support Ticket Router',
            nodes: [
              { id: 'text_1', type: 'text', data: { label: 'Customer Message', text: 'Production checkout is returning 500 errors.' } },
              {
                id: 'ollama_1',
                type: 'ollama',
                data: {
                  label: 'Classify Urgency',
                  prompt: 'Reply with ONLY one word: URGENT or NORMAL.\n\nMessage: {{text_1.text}}',
                  responseFormat: 'concise'
                }
              },
              {
                id: 'condition_1',
                type: 'condition',
                data: { label: 'Is Urgent?', leftValue: '{{ollama_1.text}}', operator: 'contains', rightValue: 'URGENT' }
              },
              {
                id: 'email_1',
                type: 'email',
                data: { label: 'Escalate Email', to: 'support@acme.io', subject: 'URGENT Customer Ticket', body: 'Message:\n{{text_1.text}}' }
              },
              {
                id: 'download_1',
                type: 'download',
                data: { label: 'Queue Normal Log', fileName: 'normal_ticket.txt', text: 'Normal priority:\n{{text_1.text}}' }
              }
            ],
            edges: [
              { source: 'text_1', target: 'ollama_1' },
              { source: 'ollama_1', target: 'condition_1' },
              { source: 'condition_1', target: 'email_1', sourceHandle: 'true' },
              { source: 'condition_1', target: 'download_1', sourceHandle: 'false' }
            ]
          }
        }
      }
    ]
  },
  // 11. Fetch API & draft tweet without extra download/text sink
  {
    turns: [
      { role: 'user', content: 'Fetch a post from https://jsonplaceholder.typicode.com/posts/1 and write a tweet about it.' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built it: fetches the post (`api_1`) and drafts a short tweet with Qwen (`ollama_1`).',
          workflow: {
            name: 'API Post to Tweet',
            nodes: [
              { id: 'api_1', type: 'api', data: { label: 'Fetch Post', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' } },
              {
                id: 'ollama_1',
                type: 'ollama',
                data: { label: 'Write Tweet', prompt: 'Write one engaging tweet (under 240 chars) based on:\n\n{{api_1.data}}', responseFormat: 'concise' }
              }
            ],
            edges: [{ source: 'api_1', target: 'ollama_1' }]
          }
        }
      }
    ]
  },
  // 12. Condition clarifying question before building
  {
    turns: [
      { role: 'user', content: 'Monitor my endpoint and notify me if it goes down.' },
      {
        role: 'assistant',
        payload: {
          action: 'ask',
          reply: 'What API URL should I check, and which email address should receive the alert?'
        }
      },
      { role: 'user', content: 'URL is https://status.myapp.com/ping and email devops@myapp.com' },
      {
        role: 'assistant',
        payload: {
          action: 'build',
          reply: 'Built the monitor: checks https://status.myapp.com/ping and emails devops@myapp.com if the status is not 200.',
          workflow: {
            name: 'Endpoint Down Alert',
            nodes: [
              { id: 'api_1', type: 'api', data: { label: 'Ping Endpoint', url: 'https://status.myapp.com/ping', method: 'GET' } },
              { id: 'condition_1', type: 'condition', data: { label: 'Status == 200?', leftValue: '{{api_1.status}}', operator: 'equals', rightValue: '200' } },
              { id: 'ollama_1', type: 'ollama', data: { label: 'OK Note', prompt: 'Write a one-line status confirmation: service returned 200 OK.', responseFormat: 'concise' } },
              { id: 'email_1', type: 'email', data: { label: 'Down Alert', to: 'devops@myapp.com', subject: 'Endpoint Down Alert', body: 'Endpoint returned HTTP {{api_1.status}}.' } }
            ],
            edges: [
              { source: 'api_1', target: 'condition_1' },
              { source: 'condition_1', target: 'ollama_1', sourceHandle: 'true' },
              { source: 'condition_1', target: 'email_1', sourceHandle: 'false' }
            ]
          }
        }
      }
    ]
  }
];


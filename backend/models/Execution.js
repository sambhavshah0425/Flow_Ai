import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  durationMs: {
    type: Number,
    default: 0
  },
  metrics: {
    tokensUsed: { type: Number, default: 0 },
    nodesExecuted: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    memoryMB: { type: Number, default: 0 }
  },
  contextOutputs: {
    type: Object,
    default: {}
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const Execution = mongoose.model('Execution', executionSchema);

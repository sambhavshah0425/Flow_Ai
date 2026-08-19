import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Execution',
    required: true,
    index: true
  },
  nodeId: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    default: 'unknown'
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  outputData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  durationMs: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Log = mongoose.model('Log', logSchema);

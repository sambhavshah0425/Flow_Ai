import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
    default: 'Untitled Workflow'
  },
  description: {
    type: String,
    default: ''
  },
  nodes: {
    type: Array,
    default: []
  },
  edges: {
    type: Array,
    default: []
  },
  version: {
    type: Number,
    default: 1
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Workflow = mongoose.model('Workflow', workflowSchema);

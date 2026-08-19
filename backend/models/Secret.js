import mongoose from 'mongoose';

const secretSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  key: {
    type: String,
    required: [true, 'Secret key name is required'],
    trim: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

secretSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Secret = mongoose.model('Secret', secretSchema);

import mongoose from 'mongoose';

const revokedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete documents when this date/time is reached
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

export const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);

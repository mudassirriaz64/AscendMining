const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });
chatSessionSchema.index({ conversationId: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

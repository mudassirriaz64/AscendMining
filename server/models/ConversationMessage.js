const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['investor', 'admin', 'support_agent'],
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

conversationMessageSchema.index({ conversationId: 1, sentAt: 1 });

module.exports = mongoose.model('ConversationMessage', conversationMessageSchema);

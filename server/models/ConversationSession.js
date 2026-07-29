const mongoose = require('mongoose');

const conversationSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    title: {
      type: String,
      default: 'New conversation',
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closeReason: {
      type: String,
      enum: ['user_close', 'inactivity', 'admin', 'system'],
      default: null,
    },
    hiddenFromAdmin: {
      type: Boolean,
      default: false,
    },
    hiddenFromUser: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

conversationSessionSchema.index({ conversationId: 1, closedAt: 1 });
conversationSessionSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('ConversationSession', conversationSessionSchema);

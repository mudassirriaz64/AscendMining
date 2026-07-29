const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConversationSession',
      default: null,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['investor', 'admin', 'support_agent', 'guest'],
      required: true,
    },
    body: {
      type: String,
      required: false,
      trim: true,
      set(value) {
        if (Array.isArray(value)) return value.join('');
        return value;
      },
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentPublicId: {
      type: String,
      default: null,
    },
    attachmentFileName: {
      type: String,
      default: null,
    },
    attachmentType: {
      type: String,
      enum: ['image', 'document', null],
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

conversationMessageSchema.pre('validate', function () {
  if (!this.body && !this.attachmentUrl) {
    this.invalidate('body', 'Either message body or attachment is required.');
  }
});

conversationMessageSchema.index({ conversationId: 1, sentAt: 1 });
conversationMessageSchema.index({ sessionId: 1, sentAt: 1 });
module.exports = mongoose.model('ConversationMessage', conversationMessageSchema);

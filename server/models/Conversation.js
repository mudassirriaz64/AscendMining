const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestId: {
      type: String,
    },
    guestName: {
      type: String,
      default: null,
    },
    guestEmail: {
      type: String,
      default: null,
    },
    guestPhone: {
      type: String,
      default: null,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageBy: {
      type: String,
      enum: ['user', 'agent'],
      default: 'user',
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    // Set when user sends a message with no subsequent agent reply; cleared when agent replies
    awaitingAgentSince: {
      type: Date,
      default: null,
    },
    unreadByAdmin: {
      type: Boolean,
      default: false,
    },
    unreadByUser: {
      type: Boolean,
      default: false,
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

conversationSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } }, name: 'userId_1_partial' }
);
conversationSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string' } }, name: 'guestId_1_partial' }
);
conversationSchema.index({ isGuest: 1 });
conversationSchema.index({ awaitingAgentSince: 1 });
conversationSchema.index({ assignedAgent: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

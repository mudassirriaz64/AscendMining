const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // exactly one Conversation per user (SCHEMA §8a)
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

// Note: userId unique index is already created by unique:true on the field above
conversationSchema.index({ awaitingAgentSince: 1 });
conversationSchema.index({ assignedAgent: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

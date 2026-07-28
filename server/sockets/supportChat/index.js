const { verifyAccessToken } = require('../../utils/tokenUtils');
const userRepository = require('../../repositories/user.repository');
const Admin = require('../../models/Admin');
const Conversation = require('../../models/Conversation');
const supportChatService = require('../../services/supportChat.service');

/**
 * Initialises the /support Socket.IO namespace.
 * Both investors and admin/support_agents connect here.
 *
 * Room naming:
 *   - Investor joins room:  `user:<userId>`
 *   - Admin joins room:     `admin` (receives all broadcasts)
 *
 * Events emitted to client:
 *   - `new_message`  { message }
 *   - `error`        { message }
 *
 * Events received from client:
 *   - `send_message`    { body }                  → investor sends message
 *   - `agent_reply`     { conversationId, body }  → admin/agent sends reply
 *   - `mark_read`       { conversationId }         → mark messages read
 */
const initSupportChatSocket = (io) => {
  const supportNS = io.of('/support');

  // --- JWT Authentication middleware for this namespace ---
  supportNS.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required.'));

      const decoded = verifyAccessToken(token);

      if (decoded.role === 'admin' || decoded.role === 'support_agent') {
        const admin = await Admin.findById(decoded.id);
        if (!admin || admin.status === 'suspended') return next(new Error('Unauthorized.'));
        socket.user = { id: admin._id.toString(), role: admin.role };
      } else {
        const user = await userRepository.findById(decoded.id);
        if (!user || user.status === 'suspended') return next(new Error('Unauthorized.'));
        socket.user = { id: user._id.toString(), role: 'investor' };
      }

      next();
    } catch (err) {
      next(new Error('Invalid token.'));
    }
  });

  supportNS.on('connection', async (socket) => {
    const { id: userId, role } = socket.user;

    if (role === 'investor') {
      // Investor joins their personal room
      socket.join(`user:${userId}`);

      // Send conversation history on connect
      try {
        const { conversation, messages } = await supportChatService.getOrCreateConversation(userId);
        socket.emit('conversation_loaded', { conversation, messages });
      } catch (err) {
        socket.emit('error', { message: 'Failed to load conversation.' });
      }

      // Investor sends a message
      socket.on('send_message', async ({ body }) => {
        if (!body || !body.trim()) return;
        try {
          const { message, conversationId } = await supportChatService.sendUserMessage(userId, body.trim());

          // Reflect back to the investor
          socket.emit('new_message', { message });

          // Broadcast to admin room
          supportNS.to('admin').emit('new_message', { conversationId, message });
        } catch (err) {
          socket.emit('error', { message: 'Failed to send message.' });
        }
      });

    } else {
      // Admin / support_agent joins the admin room
      socket.join('admin');

      // Agent sends reply to a conversation
      socket.on('agent_reply', async ({ conversationId, body }) => {
        if (!conversationId || !body || !body.trim()) return;
        try {
          const message = await supportChatService.sendAgentMessage(userId, role, conversationId, body.trim());

          // Broadcast reply to admin room (so other agents see it too)
          supportNS.to('admin').emit('new_message', { conversationId, message });

          // Notify the investor who owns this conversation
          const convoDoc = await Conversation.findById(conversationId).select('userId');
          if (convoDoc) {
            supportNS.to(`user:${convoDoc.userId.toString()}`).emit('new_message', { message });
          }
        } catch (err) {
          socket.emit('error', { message: 'Failed to send reply.' });
        }
      });
    }

    socket.on('disconnect', () => {
      // cleanup handled by socket.io automatically
    });
  });

  return supportNS;
};

module.exports = initSupportChatSocket;

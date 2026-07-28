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
 *   - `new_message`          { message, sessionId, conversationId }
 *   - `session_started`      { session }
 *   - `session_closed`       { sessionId }
 *   - `error`                { message }
 *
 * Events received from client:
 *   - `send_message`    { body, sessionId? }          → investor sends message
 *   - `agent_reply`     { conversationId, body }      → admin/agent sends reply
 *   - `start_session`   {}                             → investor starts new session
 *   - `close_session`   { sessionId }                  → investor closes session
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

      // Send active session on connect
      try {
        const { session, messages } = await supportChatService.getOrCreateActiveSession(userId);
        socket.emit('active_session', { session, messages });
      } catch (err) {
        socket.emit('error', { message: 'Failed to load session.' });
      }

      // Investor starts a new session
      socket.on('start_session', async () => {
        try {
          const { session } = await supportChatService.startNewSession(userId);
          socket.emit('session_started', { session });

          // Notify admin room about new session
          supportNS.to('admin').emit('session_started', { userId, session });
        } catch (err) {
          socket.emit('error', { message: 'Failed to start session.' });
        }
      });

      // Investor sends a message
      socket.on('send_message', async ({ body, sessionId }) => {
        if (!body || !body.trim()) return;
        try {
          const { message, conversationId, sessionId: msgSessionId } = await supportChatService.sendUserMessage(
            userId,
            body.trim(),
            sessionId
          );

          // Reflect back to the investor
          socket.emit('new_message', { message, sessionId: msgSessionId, conversationId });

          // Broadcast to admin room
          supportNS.to('admin').emit('new_message', { conversationId, sessionId: msgSessionId, message });
        } catch (err) {
          socket.emit('error', { message: 'Failed to send message.' });
        }
      });

      // Investor closes a session
      socket.on('close_session', async ({ sessionId }) => {
        try {
          await supportChatService.closeSession(userId, sessionId);
          socket.emit('session_closed', { sessionId });

          // Notify admin
          supportNS.to('admin').emit('session_closed', { userId, sessionId });
        } catch (err) {
          socket.emit('error', { message: 'Failed to close session.' });
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
            supportNS.to(`user:${convoDoc.userId.toString()}`).emit('new_message', { message, conversationId });
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

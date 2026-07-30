const socketAuth = require('../auth');
const supportChatService = require('../../services/supportChat.service');
const { emitAlarmClear, emitAlarmTrigger } = require('../../utils/supportChatEvents');

const initSupportChatSocket = (io) => {
  const namespace = io.of('/support');
  namespace.use(socketAuth);

  // Helper to broadcast active agent presence count
  const broadcastAgentsStatus = async () => {
    try {
      const adminSockets = await namespace.in('admin-alerts').allSockets();
      namespace.emit('agents:status', { online: adminSockets.size > 0 });
    } catch (e) {
      console.error('[Socket] Failed to broadcast agents status:', e);
    }
  };

  namespace.on('connection', async (socket) => {
    const { id, role } = socket.user;

    if (role === 'admin' || role === 'support_agent') {
      socket.join('admin-alerts');
      await broadcastAgentsStatus();
    } else {
      // Send initial agents presence status to connecting investor
      const adminSockets = await namespace.in('admin-alerts').allSockets();
      socket.emit('agents:status', { online: adminSockets.size > 0 });
    }

    if (role === 'investor') {
      const conversation = socket.user.isGuest
        ? await supportChatService.getConversationByGuestId(id)
        : await supportChatService.getConversationByUserId(id);
      if (conversation) socket.join(`conversation:${conversation._id}`);
    }

    socket.on('conversation:join', async ({ conversationId } = {}, acknowledge = () => {}) => {
      try {
        if (!conversationId) throw new Error('Conversation ID is required.');
        if (role === 'investor') {
          const conversation = socket.user.isGuest
            ? await supportChatService.getConversationByGuestId(id)
            : await supportChatService.getConversationByUserId(id);
          if (!conversation || conversation._id.toString() !== conversationId) throw new Error('Forbidden.');
        }
        socket.join(`conversation:${conversationId}`);

        // If an agent joins a room, mark the messages read and broadcast seen
        if (role !== 'investor') {
          await supportChatService.markConversationOpened(conversationId, id);
          emitAlarmClear(namespace, conversationId);
          namespace.to(`conversation:${conversationId}`).emit('conversation:read', {
            conversationId,
            readerRole: role,
            readAt: new Date(),
          });
        }

        acknowledge({ ok: true });
      } catch (error) { acknowledge({ ok: false, message: error.message }); }
    });

    socket.on('message:send', async ({ conversationId, body, sessionId, attachmentUrl, attachmentPublicId, attachmentFileName, attachmentType, messageId } = {}, acknowledge = () => {}) => {
      try {
        let targetId = conversationId;
        let targetSessionId = sessionId || null;
        if (role === 'investor') {
          const conversation = socket.user.isGuest
            ? await supportChatService.getConversationByGuestId(id)
            : await supportChatService.getOrCreateConversation(id);
          if (!conversation) throw new Error('Conversation not found.');
          targetId = conversation._id.toString();
          if (!targetSessionId) {
            const sessions = await supportChatService.getSessions(targetId);
            targetSessionId = sessions.length > 0 ? sessions[0]._id.toString() : null;
          }
        }
        const senderRole = socket.user.isGuest ? 'guest' : role;
        const result = await supportChatService.sendMessage({
          conversationId: targetId,
          senderId: id,
          senderRole,
          body,
          sessionId: targetSessionId,
          attachmentUrl,
          attachmentPublicId,
          attachmentFileName,
          attachmentType,
          messageId,
        });
        socket.join(`conversation:${targetId}`);
        namespace.to(`conversation:${targetId}`).to('admin-alerts').emit('message:new', result);
        if (result.startedWaiting) {
          emitAlarmTrigger(namespace, targetId, result.conversation.awaitingAgentSince);
        } else if (role !== 'investor') {
          emitAlarmClear(namespace, targetId);
        }
        acknowledge({ ok: true, data: result });
      } catch (error) { acknowledge({ ok: false, message: error.message }); }
    });

    socket.on('conversation:read', async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return;
        if (role === 'investor') {
          await supportChatService.getMyConversation(id, { markRead: true });
        } else {
          await supportChatService.markConversationOpened(conversationId, id);
          emitAlarmClear(namespace, conversationId);
        }
        // Notify other room participants
        socket.to(`conversation:${conversationId}`).emit('conversation:read', {
          conversationId,
          readerRole: role,
          readAt: new Date(),
        });
      } catch (e) {
        console.warn('[Socket] Read acknowledgment failed:', e);
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        senderRole: socket.user.isGuest ? 'guest' : role,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        senderRole: socket.user.isGuest ? 'guest' : role,
      });
    });

    socket.on('disconnect', async () => {
      if (role === 'admin' || role === 'support_agent') {
        await broadcastAgentsStatus();
      }
    });
  });

  return namespace;
};

module.exports = initSupportChatSocket;


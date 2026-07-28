const socketAuth = require('../auth');
const supportChatService = require('../../services/supportChat.service');

const initSupportChatSocket = (io) => {
  const namespace = io.of('/support');
  namespace.use(socketAuth);

  namespace.on('connection', async (socket) => {
    const { id, role } = socket.user;
    if (role === 'admin' || role === 'support_agent') socket.join('admin-alerts');

    if (role === 'investor') {
      const conversation = await supportChatService.getConversationByUserId(id);
      if (conversation) socket.join(`conversation:${conversation._id}`);
    }

    socket.on('conversation:join', async ({ conversationId } = {}, acknowledge = () => {}) => {
      try {
        if (!conversationId) throw new Error('Conversation ID is required.');
        if (role === 'investor') {
          const conversation = await supportChatService.getConversationByUserId(id);
          if (!conversation || conversation._id.toString() !== conversationId) throw new Error('Forbidden.');
        }
        socket.join(`conversation:${conversationId}`);
        acknowledge({ ok: true });
      } catch (error) { acknowledge({ ok: false, message: error.message }); }
    });

    socket.on('message:send', async ({ conversationId, body, sessionId } = {}, acknowledge = () => {}) => {
      try {
        let targetId = conversationId;
        let targetSessionId = sessionId || null;
        if (role === 'investor') {
          const conversation = await supportChatService.getOrCreateConversation(id);
          targetId = conversation._id.toString();
          if (!targetSessionId) {
            const sessions = await supportChatService.getSessions(targetId);
            targetSessionId = sessions.length > 0 ? sessions[0]._id.toString() : null;
          }
        }
        const result = await supportChatService.sendMessage({
          conversationId: targetId,
          senderId: id,
          senderRole: role,
          body,
          sessionId: targetSessionId,
        });
        socket.join(`conversation:${targetId}`);
        namespace.to(`conversation:${targetId}`).emit('message:new', result);
        if (result.startedWaiting) {
          namespace.to('admin-alerts').emit('alarm:trigger', {
            conversationId: targetId.toString(),
            awaitingAgentSince: result.conversation.awaitingAgentSince,
          });
        } else if (role !== 'investor') {
          namespace.to('admin-alerts').emit('alarm:clear', { conversationId: targetId.toString() });
        }
        acknowledge({ ok: true, data: result });
      } catch (error) { acknowledge({ ok: false, message: error.message }); }
    });
  });

  return namespace;
};

module.exports = initSupportChatSocket;

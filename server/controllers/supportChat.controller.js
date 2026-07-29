const supportChatService = require('../services/supportChat.service');
const { emitAlarmClear, emitAlarmTrigger } = require('../utils/supportChatEvents');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const pagination = (query, fallback = 50) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || fallback, 1), 100),
});

const getMyConversation = async (req, res, next) => {
  try {
    const data = await supportChatService.getMyConversation(req.user.id, {
      ...pagination(req.query),
      markRead: req.query.opened === 'true',
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getMySessionMessages = async (req, res, next) => {
  try {
    const data = await supportChatService.getMySessionMessages(req.user.id, req.params.sessionId, pagination(req.query, 100));
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getOrCreateConversation(req.user.id);
    const session = await supportChatService.createSession(conversation._id, req.body.title);
    res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getConversationByUserId(req.user.id);
    if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    await supportChatService.deleteSession(req.params.sessionId, conversation._id);
    res.json({ success: true, data: { message: 'Session deleted.' } });
  } catch (error) { next(error); }
};

const sendMessage = async (req, res, next) => {
  try {
    const isInvestor = req.user.role === 'investor';
    let conversationId;
    let sessionId = req.body.sessionId || null;

    if (isInvestor) {
      const conversation = await supportChatService.getOrCreateConversation(req.user.id);
      conversationId = conversation._id;
      if (!sessionId) {
        const sessions = await supportChatService.getSessions(conversationId);
        sessionId = sessions.length > 0 ? sessions[0]._id : null;
      }
    } else {
      conversationId = req.body.conversationId;
      sessionId = req.body.sessionId || null;
    }

    const result = await supportChatService.sendMessage({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      body: req.body.body,
      sessionId,
      attachmentUrl: req.body.attachmentUrl || null,
      attachmentPublicId: req.body.attachmentPublicId || null,
      attachmentFileName: req.body.attachmentFileName || null,
      attachmentType: req.body.attachmentType || null,
      messageId: req.body.messageId || null,
    });
    req.app.get('supportNamespace')?.to(`conversation:${conversationId}`).emit('message:new', result);
    if (result.startedWaiting) {
      emitAlarmTrigger(
        req.app.get('supportNamespace'),
        conversationId,
        result.conversation.awaitingAgentSince
      );
    } else if (!isInvestor) {
      emitAlarmClear(req.app.get('supportNamespace'), conversationId);
    }
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getConversations = async (req, res, next) => {
  try {
    res.json({ success: true, data: await supportChatService.getConversations(pagination(req.query, 30)) });
  } catch (error) { next(error); }
};

const openConversation = async (req, res, next) => {
  try {
    const data = await supportChatService.openConversation(req.params.id, req.user.id, pagination(req.query, 100));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    emitAlarmClear(req.app.get('supportNamespace'), req.params.id);
    
    if (data.systemMessage) {
      req.app.get('supportNamespace')?.to(`conversation:${req.params.id}`).emit('message:new', {
        message: data.systemMessage,
        conversation: data.conversation,
        sessionId: data.systemMessage.sessionId.toString(),
      });
    }

    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getWaiting = async (req, res, next) => {
  try {
    const conversations = await supportChatService.getWaitingConversations();
    res.json({ success: true, data: { conversations, count: conversations.length } });
  } catch (error) { next(error); }
};

const adminDeleteSession = async (req, res, next) => {
  try {
    await supportChatService.adminDeleteSession(req.params.sessionId);
    res.json({ success: true, data: { message: 'Session deleted.' } });
  } catch (error) { next(error); }
};

const closeSession = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getConversationByUserId(req.user.id);
    if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    const session = await supportChatService.closeSession(req.params.sessionId, req.user.id, req.body.reason || 'user_close');
    res.json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const uploadToCloudinary = (fileBuffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""), // Cloudinary adds extension automatically
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'Please provide a file to upload.',
          status: 400,
        },
      });
    }

    let conversationId;
    if (req.params.id) {
      conversationId = req.params.id;
    } else {
      const conversation = await supportChatService.getOrCreateConversation(req.user.id);
      conversationId = conversation._id.toString();
    }

    const messageId = new mongoose.Types.ObjectId();
    const originalFilename = req.file.originalname;
    const folder = `support-conversations/${conversationId}`;
    const filename = `${messageId}-${originalFilename}`;

    const uploadResult = await uploadToCloudinary(req.file.buffer, folder, filename);
    const attachmentType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';

    res.status(200).json({
      success: true,
      data: {
        attachmentUrl: uploadResult.secure_url,
        attachmentPublicId: uploadResult.public_id,
        attachmentFileName: originalFilename,
        attachmentType,
        messageId: messageId.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminCreateSession = async (req, res, next) => {
  try {
    const session = await supportChatService.adminCreateSession(req.params.id, req.body.title);
    res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const adminDeleteConversation = async (req, res, next) => {
  try {
    await supportChatService.adminDeleteConversation(req.params.id);
    res.json({ success: true, data: { message: 'Conversation deleted.' } });
  } catch (error) { next(error); }
};

module.exports = {
  getMyConversation,
  getMySessionMessages,
  createSession,
  deleteSession,
  closeSession,
  sendMessage,
  getConversations,
  openConversation,
  getWaiting,
  adminDeleteSession,
  uploadAttachment,
  adminCreateSession,
  adminDeleteConversation,
};

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
    let data;
    if (req.user.isGuest) {
      const Conversation = require('../models/Conversation');
      const conversation = await Conversation.findOne({ guestId: req.user.id });
      if (!conversation) {
        return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      }

      const sessions = await supportChatService.getSessions(conversation._id);
      if (sessions.length === 0) {
        const newSession = await supportChatService.createSession(conversation._id);
        sessions.unshift({ ...newSession.toObject(), _id: newSession._id });
      }

      const activeSessionId = sessions[0]._id;
      const messages = await require('../repositories/conversationMessage.repository').findBySessionId(activeSessionId, pagination(req.query));

      if (req.query.opened === 'true') {
        const messageRepo = require('../repositories/conversationMessage.repository');
        const conversationRepo = require('../repositories/conversation.repository');
        await Promise.all([
          messageRepo.markReadByConversation(conversation._id, 'investor'),
          conversationRepo.updateById(conversation._id, { unreadByUser: false }),
        ]);
      }

      data = {
        conversation: supportChatService.serializeConversation({ ...conversation.toObject(), unreadByUser: req.query.opened === 'true' ? false : conversation.unreadByUser }),
        sessions: sessions.map(supportChatService.serializeSession),
        activeSessionId: activeSessionId.toString(),
        messages: messages.map(supportChatService.serializeMessage),
        page: pagination(req.query).page,
      };
    } else {
      data = await supportChatService.getMyConversation(req.user.id, {
        ...pagination(req.query),
        markRead: req.query.opened === 'true',
      });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getMySessionMessages = async (req, res, next) => {
  try {
    let conversationId;
    if (req.user.isGuest) {
      const Conversation = require('../models/Conversation');
      const conversation = await Conversation.findOne({ guestId: req.user.id });
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    } else {
      const conversation = await supportChatService.getConversationByUserId(req.user.id);
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    }

    const session = await require('../repositories/conversationSession.repository').findById(req.params.sessionId);
    if (!session || session.conversationId.toString() !== conversationId.toString() || session.hiddenFromUser) {
      return res.json({ success: true, data: { messages: [], session: null } });
    }

    const messages = await require('../repositories/conversationMessage.repository').findBySessionId(req.params.sessionId, pagination(req.query, 100));
    res.json({
      success: true,
      data: {
        messages: messages.map(supportChatService.serializeMessage),
        session: supportChatService.serializeSession(session),
      },
    });
  } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
  try {
    req.body = req.body || {};
    let conversationId;
    if (req.user.isGuest) {
      const Conversation = require('../models/Conversation');
      const conversation = await Conversation.findOne({ guestId: req.user.id });
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    } else {
      const conversation = await supportChatService.getOrCreateConversation(req.user.id);
      conversationId = conversation._id;
    }

    const session = await supportChatService.createSession(conversationId, req.body.title);
    req.app.get('supportNamespace')?.to(`conversation:${conversationId}`).emit('session:new', { session });
    res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    let conversationId;
    if (req.user.isGuest) {
      const Conversation = require('../models/Conversation');
      const conversation = await Conversation.findOne({ guestId: req.user.id });
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    } else {
      const conversation = await supportChatService.getConversationByUserId(req.user.id);
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    }
    await supportChatService.deleteSession(req.params.sessionId, conversationId);
    res.json({ success: true, data: { message: 'Session deleted.' } });
  } catch (error) { next(error); }
};

const sendMessage = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const isInvestor = req.user.role === 'investor';
    let conversationId;
    let sessionId = req.body.sessionId || null;

    if (isInvestor) {
      if (req.user.isGuest) {
        const Conversation = require('../models/Conversation');
        const conversation = await Conversation.findOne({ guestId: req.user.id });
        if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
        conversationId = conversation._id;
      } else {
        const conversation = await supportChatService.getOrCreateConversation(req.user.id);
        conversationId = conversation._id;
      }
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
      senderRole: req.user.isGuest ? 'guest' : req.user.role,
      body: req.body.body,
      sessionId,
      attachmentUrl: req.body.attachmentUrl || null,
      attachmentPublicId: req.body.attachmentPublicId || null,
      attachmentFileName: req.body.attachmentFileName || null,
      attachmentType: req.body.attachmentType || null,
      messageId: req.body.messageId || null,
    });
    req.app.get('supportNamespace')?.to(`conversation:${conversationId}`).to('admin-alerts').emit('message:new', result);
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
      req.app.get('supportNamespace')?.to(`conversation:${req.params.id}`).to('admin-alerts').emit('message:new', {
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
    req.body = req.body || {};
    let conversationId;
    if (req.user.isGuest) {
      const Conversation = require('../models/Conversation');
      const conversation = await Conversation.findOne({ guestId: req.user.id });
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    } else {
      const conversation = await supportChatService.getConversationByUserId(req.user.id);
      if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
      conversationId = conversation._id;
    }

    const session = await require('../repositories/conversationSession.repository').findById(req.params.sessionId);
    if (!session || session.conversationId.toString() !== conversationId.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden.' } });
    }

    const closedSession = await supportChatService.closeSession(req.params.sessionId, req.user.id, req.body.reason || 'user_close');
    res.json({ success: true, data: { session: closedSession } });
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
    const folder = `ascendhash/support-conversations/${conversationId}`;
    const filename = `${messageId}-${originalFilename}`;

    let uploadBuffer = req.file.buffer;
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const sharp = require('sharp');
        uploadBuffer = await sharp(req.file.buffer)
          .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (sharpError) {
        console.warn('[Sharp] Chat image compression failed, using original buffer', sharpError);
      }
    }

    const uploadResult = await uploadToCloudinary(uploadBuffer, folder, filename);
    let attachmentType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      attachmentType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      attachmentType = 'video';
    }

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
    req.body = req.body || {};
    const session = await supportChatService.adminCreateSession(req.params.id, req.body.title);
    req.app.get('supportNamespace')?.to(`conversation:${req.params.id}`).emit('session:new', { session });
    res.status(201).json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const adminDeleteConversation = async (req, res, next) => {
  try {
    await supportChatService.adminDeleteConversation(req.params.id);
    res.json({ success: true, data: { message: 'Conversation deleted.' } });
  } catch (error) { next(error); }
};

const adminCloseSession = async (req, res, next) => {
  try {
    const session = await supportChatService.closeSession(req.params.sessionId, req.user.id, 'admin');
    res.json({ success: true, data: { session } });
  } catch (error) { next(error); }
};

const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await supportChatService.getConversationByUserId(req.user.id);
    if (!conversation) return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    const result = await supportChatService.deleteConversation(conversation._id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const createGuestConversation = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const { guestId, name, email, phone } = req.body;
    if (!guestId || !name || !email) {
      return res.status(400).json({ success: false, error: { message: 'GuestId, Name, and Email are required.' } });
    }

    const Conversation = require('../models/Conversation');
    const jwt = require('jsonwebtoken');

    let conversation = await Conversation.findOne({ guestId });
    if (!conversation) {
      conversation = await Conversation.create({
        isGuest: true,
        guestId,
        guestName: name,
        guestEmail: email,
        guestPhone: phone || null,
        lastMessageAt: new Date(),
      });
    }

    const guestToken = jwt.sign(
      { id: guestId, role: 'investor', isGuest: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        conversation,
        token: guestToken,
      },
    });
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
  adminCloseSession,
  deleteConversation,
  createGuestConversation,
};

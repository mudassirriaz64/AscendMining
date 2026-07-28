const test = require('node:test');
const assert = require('node:assert/strict');

const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/conversationMessage.repository');

test('two sessions for one investor append to the same persistent conversation', async (t) => {
  const original = {
    getOrCreateByUserId: conversationRepo.getOrCreateByUserId,
    findById: conversationRepo.findById,
    updateById: conversationRepo.updateById,
    markAwaitingIfNull: conversationRepo.markAwaitingIfNull,
    create: messageRepo.create,
  };
  t.after(() => {
    conversationRepo.getOrCreateByUserId = original.getOrCreateByUserId;
    conversationRepo.findById = original.findById;
    conversationRepo.updateById = original.updateById;
    conversationRepo.markAwaitingIfNull = original.markAwaitingIfNull;
    messageRepo.create = original.create;
  });

  const persistentConversation = {
    _id: 'conversation-1',
    userId: 'investor-1',
    awaitingAgentSince: null,
  };
  let createConversationCalls = 0;
  const storedMessages = [];

  conversationRepo.getOrCreateByUserId = async () => {
    createConversationCalls += 1;
    return persistentConversation;
  };
  conversationRepo.findById = async () => persistentConversation;
  conversationRepo.updateById = async (_id, update) => Object.assign(persistentConversation, update);
  conversationRepo.markAwaitingIfNull = async () => {
    if (persistentConversation.awaitingAgentSince) return null;
    persistentConversation.awaitingAgentSince = new Date();
    return persistentConversation;
  };
  messageRepo.create = async (message) => {
    const stored = { _id: `message-${storedMessages.length + 1}`, ...message };
    storedMessages.push(stored);
    return stored;
  };

  delete require.cache[require.resolve('../services/supportChat.service')];
  const service = require('../services/supportChat.service');
  const firstSessionConversation = await service.getOrCreateConversation('investor-1');
  await service.sendMessage({ conversationId: firstSessionConversation._id, senderId: 'investor-1', senderRole: 'investor', body: 'First session' });
  const secondSessionConversation = await service.getOrCreateConversation('investor-1');
  await service.sendMessage({ conversationId: secondSessionConversation._id, senderId: 'investor-1', senderRole: 'investor', body: 'Second session' });

  assert.equal(firstSessionConversation._id, secondSessionConversation._id);
  assert.equal(new Set(storedMessages.map((message) => message.conversationId)).size, 1);
  assert.equal(storedMessages.length, 2);
  assert.equal(createConversationCalls, 2, 'both sessions perform the safe lookup/upsert');
});

const supportTicketRepo = require('../repositories/supportTicket.repository');
const conversationRepo = require('../repositories/conversation.repository');
const { SLA_MS } = require('./supportChat.service');

const createSupportTicket = async ({ userId, conversationId, subject, escalationReason = 'no_agent_response_30min' }) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation || conversation.userId.toString() !== userId.toString()) {
    const error = new Error('Conversation not found.');
    error.statusCode = 404;
    throw error;
  }
  if (!conversation.awaitingAgentSince || Date.now() - conversation.awaitingAgentSince.getTime() < SLA_MS) {
    const error = new Error('Escalation is available after 30 minutes without an agent response.');
    error.statusCode = 409;
    throw error;
  }
  return supportTicketRepo.create({
    userId,
    conversationId,
    subject: subject?.trim() || 'Live chat response overdue',
    escalationReason,
  });
};

const getUserTickets = async (userId, { page = 1, limit = 20, status } = {}) => {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    supportTicketRepo.findByUserId(userId, { skip, limit, status }),
    supportTicketRepo.countByUserId(userId, { status }),
  ]);
  return { tickets, total, page, totalPages: Math.ceil(total / limit) };
};

const getAllTickets = async ({ page = 1, limit = 30, status } = {}) => {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    supportTicketRepo.findAll({ skip, limit, status }),
    supportTicketRepo.countAll({ status }),
  ]);
  return { tickets, total, page, totalPages: Math.ceil(total / limit) };
};

const updateTicket = async (ticketId, { status, assignedAgent }) => {
  const update = {};
  if (status) update.status = status;
  if (assignedAgent !== undefined) update.assignedAgent = assignedAgent;
  if (status === 'resolved') update.resolvedAt = new Date();
  return supportTicketRepo.updateById(ticketId, update);
};

module.exports = {
  createSupportTicket,
  getUserTickets,
  getAllTickets,
  updateTicket,
  getTicketById: supportTicketRepo.findById,
};

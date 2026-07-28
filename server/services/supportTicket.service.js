const supportTicketRepo = require('../repositories/supportTicket.repository');
const conversationRepo = require('../repositories/conversation.repository');

/**
 * Investor: Create a new support ticket
 */
const createTicket = async (userId, { subject, conversationId, escalationReason = 'user_manual' }) => {
  const ticket = await supportTicketRepo.create({
    userId,
    conversationId: conversationId || null,
    subject,
    escalationReason,
  });
  return ticket;
};

/**
 * Investor: Get their own tickets
 */
const getUserTickets = async (userId, { page = 1, limit = 20, status } = {}) => {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    supportTicketRepo.findByUserId(userId, { skip, limit, status }),
    supportTicketRepo.countByUserId(userId, { status }),
  ]);
  return { tickets, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Admin: Get all tickets
 */
const getAllTickets = async ({ page = 1, limit = 30, status } = {}) => {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    supportTicketRepo.findAll({ skip, limit, status }),
    supportTicketRepo.countAll({ status }),
  ]);
  return { tickets, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Admin: Update ticket status or assign agent
 */
const updateTicket = async (ticketId, { status, assignedAgent }) => {
  const updateData = {};
  if (status) updateData.status = status;
  if (assignedAgent !== undefined) updateData.assignedAgent = assignedAgent;
  if (status === 'resolved') updateData.resolvedAt = new Date();
  return supportTicketRepo.updateById(ticketId, updateData);
};

/**
 * Get a single ticket by ID
 */
const getTicketById = async (ticketId) => {
  return supportTicketRepo.findById(ticketId);
};

module.exports = {
  createTicket,
  getUserTickets,
  getAllTickets,
  updateTicket,
  getTicketById,
};

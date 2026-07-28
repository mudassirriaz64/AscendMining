const supportTicketService = require('../services/supportTicket.service');

/**
 * POST /api/support/tickets
 * Investor: Create a new support ticket
 */
const createTicket = async (req, res, next) => {
  try {
    const { subject, conversationId, escalationReason } = req.body;
    const ticket = await supportTicketService.createTicket(req.user.id, {
      subject,
      conversationId,
      escalationReason,
    });
    return res.status(201).json({ success: true, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/support/tickets
 * Investor: Get their own tickets
 */
const getMyTickets = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await supportTicketService.getUserTickets(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/support/tickets
 * Admin: Get all tickets
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await supportTicketService.getAllTickets({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 30,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/support/tickets/:id
 * Admin: Update ticket status or assigned agent
 */
const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedAgent } = req.body;
    const ticket = await supportTicketService.updateTicket(id, { status, assignedAgent });
    if (!ticket) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found.', status: 404 } });
    }
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/support/tickets/:id
 * Admin: Get a single ticket
 */
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await supportTicketService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found.', status: 404 } });
    }
    return res.status(200).json({ success: true, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
  getTicketById,
};

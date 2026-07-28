const service = require('../services/supportTicket.service');

const escalate = async (req, res, next) => {
  try {
    const ticket = await service.createSupportTicket({
      userId: req.user.id,
      conversationId: req.body.conversationId,
      subject: req.body.subject,
      escalationReason: 'no_agent_response_30min',
    });
    res.status(201).json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
};

const getMyTickets = async (req, res, next) => {
  try {
    const data = await service.getUserTickets(req.user.id, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      status: req.query.status,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getAllTickets = async (req, res, next) => {
  try {
    const data = await service.getAllTickets({
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 30,
      status: req.query.status,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await service.updateTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found.' } });
    return res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await service.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found.' } });
    return res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
};

module.exports = { escalate, getMyTickets, getAllTickets, updateTicket, getTicketById };

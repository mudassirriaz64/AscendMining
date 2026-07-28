const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const supportTicketController = require('../../controllers/supportTicket.controller');

// Admin: Get all tickets (with optional status filter)
router.get('/', authMiddleware, requireRole('admin', 'support_agent'), supportTicketController.getAllTickets);

// Admin: Get single ticket
router.get('/:id', authMiddleware, requireRole('admin', 'support_agent'), supportTicketController.getTicketById);

// Admin: Update ticket status / assign agent
router.patch('/:id', authMiddleware, requireRole('admin', 'support_agent'), supportTicketController.updateTicket);

module.exports = router;

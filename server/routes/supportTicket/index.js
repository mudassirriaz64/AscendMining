const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const supportTicketController = require('../../controllers/supportTicket.controller');

// Investor: Create a new support ticket
router.post('/', authMiddleware, supportTicketController.createTicket);

// Investor: Get own tickets
router.get('/', authMiddleware, supportTicketController.getMyTickets);

module.exports = router;

const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { emitAdminUpdate } = require('../utils/dashboardEvents');

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required.' } });
    }
    const newMessage = await ContactMessage.create({ name, email, subject, message });
    emitAdminUpdate(req.app, 'admin:contact:new', newMessage);
    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

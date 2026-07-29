const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

router.get('/', async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const FAQ = require('../../models/FAQ');

const getAllFAQs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { faqs },
    });
  } catch (error) {
    next(error);
  }
};

const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, isActive, order } = req.body;
    
    const newFAQ = await FAQ.create({
      question,
      answer,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: { faq: newFAQ }
    });
  } catch (error) {
    next(error);
  }
};

const updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, isActive, order } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { question, answer, isActive, order },
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(404).json({ success: false, error: { message: 'FAQ not found' } });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: { faq }
    });
  } catch (error) {
    next(error);
  }
};

const deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({ success: false, error: { message: 'FAQ not found' } });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};

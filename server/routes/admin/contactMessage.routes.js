const express = require('express');
const router = express.Router();
const contactMessageController = require('../../controllers/admin/contactMessage.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

router.use(auth, requireRole('admin', 'support_agent'));

router.get('/', contactMessageController.getAllMessages);
router.patch('/:id/read', contactMessageController.markAsRead);
router.delete('/:id', requireRole('admin'), contactMessageController.deleteMessage); // Only admin can delete

module.exports = router;

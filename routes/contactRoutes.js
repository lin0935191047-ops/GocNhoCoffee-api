const express = require('express');

const router = express.Router();

const {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage,
  replyToContactMessage,
} = require('../controllers/contactController');

const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/', createContactMessage);

router.get('/', authMiddleware, adminOnly, getContactMessages);

router.post(
  '/:id/reply',
  authMiddleware,
  adminOnly,
  replyToContactMessage,
);

router.get(
  '/:id',
  authMiddleware,
  adminOnly,
  getContactMessageById,
);

router.put(
  '/:id/status',
  authMiddleware,
  adminOnly,
  updateContactMessageStatus,
);

router.delete(
  '/:id',
  authMiddleware,
  adminOnly,
  deleteContactMessage,
);

module.exports = router;

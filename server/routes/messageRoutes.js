const express = require('express');
const { validateTokenVersion } = require('../middleware/authMiddleware');
const {
  searchMembers,
  listConversations,
  openDirect,
  getConversation,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.use(validateTokenVersion);
router.get('/members', searchMembers);
router.get('/conversations', listConversations);
router.post('/conversations', openDirect);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id', sendMessage);

module.exports = router;

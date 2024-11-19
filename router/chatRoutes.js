const express = require('express');
const { createChat, getChats } = require('../controllers/chatController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createChat);
router.get('/', auth, getChats);

module.exports = router;

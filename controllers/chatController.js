const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.createChat = async (req, res) => {
    try {
        const { members } = req.body;
        const chat = await Chat.create({ members });
        res.status(201).json({ success: true, chat });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ members: req.user.id }).populate('members', 'username');
        res.status(200).json({ success: true, chats });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

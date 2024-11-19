const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    try {
        const { chatId, text, image, document, audio } = req.body;
        const message = await Message.create({
            sender: req.user.id,
            chat: chatId,
            text,
            image,
            document,
            audio,
        });
        res.status(201).json({ success: true, message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId }).populate('sender', 'username');
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    text: { type: String },
    image: { type: String },
    document: { type: String },
    audio: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);

const mongoose = require('mongoose');

const challengeCompletionSchema = new mongoose.Schema({
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcoChallenge', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String,required:true, }],  // Store image paths
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'declined'], default: 'pending' },
    pointsAchieved: { type: Number, default: 0 },
    carbonEmission: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChallengeCompletion', challengeCompletionSchema);

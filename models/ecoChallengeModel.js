const mongoose = require('mongoose');

const ecoChallengeSchema = new mongoose.Schema({
    taskNo: Number,
    name: String,
    challenge: String,
    benefitsToSociety: String,
    points: Number,
    image: String,
    timeline: String,
    requiredImage: Number,
    carbonEmission: String,
    type: {
        type: String,
        enum: ['week', 'month'],
        required: true
    }
});

module.exports = mongoose.model('EcoChallenge', ecoChallengeSchema);

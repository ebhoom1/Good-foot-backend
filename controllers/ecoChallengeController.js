const EcoChallenge = require('../models/ecoChallengeModel');
const path = require('path');

// Add a new challenge with image upload
exports.addEcoChallenge = async (req, res) => {
    const { taskNo, name, challenge, benefitsToSociety, points, timeline, requiredImage, carbonEmission, type } = req.body;
    const imagePath = req.file ? `/uploads/ecochallenges/task/${req.file.filename}` : null;

    try {
        const newChallenge = new EcoChallenge({
            taskNo,
            name,
            challenge,
            benefitsToSociety,
            points,
            image: imagePath,
            timeline,
            requiredImage,
            carbonEmission,
            type
        });

        await newChallenge.save();
        res.status(201).json({ message: 'Challenge added successfully', challenge: newChallenge });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add challenge', error: error.message });
    }
};


// Get all challenges (week or month)
exports.getEcoChallenges = async (req, res) => {
    const { type } = req.params;
    try {
        const challenges = await EcoChallenge.find({ type });
        res.status(200).json(challenges);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch challenges', error: error.message });
    }
};

// Get a single eco-challenge by Id
exports.getEcoChallengeById = async (req, res) => {
    const { id } = req.params;
    try {
        const challenge = await EcoChallenge.findById(id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.status(200).json(challenge);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch challenge', error: error.message });
    }
};


// Update a challenge by Id
exports.updateEcoChallenge = async (req, res) => {
    const { id } = req.params;
    const { taskNo, name, challenge, benefitsToSociety, points, timeline, requiredImage, carbonEmission, type } = req.body;
    const imagePath = req.file ? `/uploads/ecochallenges/task/${req.file.filename}` : null;

    try {
        const updatedData = {
            taskNo,
            name,
            challenge,
            benefitsToSociety, 
            points, 
            timeline,
            requiredImage,
            carbonEmission,
            type,
        };
        if (imagePath) updatedData.image = imagePath;

        const updatedChallenge = await EcoChallenge.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedChallenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.status(200).json({ message: 'Challenge updated successfully', challenge: updatedChallenge });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update challenge', error: error.message });
    }
};

// Delete a challenge by Id
exports.deleteEcoChallenge = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedChallenge = await EcoChallenge.findByIdAndDelete(id);

        if (!deletedChallenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.status(200).json({ message: 'Challenge deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete challenge', error: error.message });
    }
};

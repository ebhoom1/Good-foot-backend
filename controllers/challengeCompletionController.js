const ChallengeCompletion = require('../models/challengeCompletionModel');
const User = require('../models/User');
const EcoChallenge = require('../models/ecoChallengeModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads'); // Adjust the path to your 'uploads' directory
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create the directory if it doesn't exist
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Save file with current timestamp + original extension
    }
});


const upload = multer({ storage });

// Middleware to handle multiple images upload
exports.uploadImages = upload.array('images', 11);  // Maximum 10 images


exports.submitChallengeCompletion = async (req, res) => {
    const { userId, challengeId, description } = req.body;
    const images = req.files.map(file => `/uploads/${file.filename}`);

    try {
        const existingCompletion = await ChallengeCompletion.findOne({ userId, challengeId });

        if (existingCompletion) {
            if (existingCompletion.status === 'pending') {
                return res.status(400).json({ message: 'This task is already submitted and is in pending status.' });
            }
            if (existingCompletion.status === 'success') {
                return res.status(400).json({ message: 'You have already completed this task successfully.' });
            }
            if (existingCompletion.status === 'denied') {
                return res.status(400).json({ message: 'This task was denied. You can resubmit it.' });
            }
        }

        const challenge = await EcoChallenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        const completion = new ChallengeCompletion({
            userId,
            challengeId,
            images,
            description,
            pointsAchieved: challenge.points,
            carbonEmission: challenge.carbonEmission,
            status: 'pending',
        });

        await completion.save();
        res.status(201).json({ message: 'Challenge submitted successfully', completion });
    } catch (error) {
        res.status(500).json({ message: 'Failed to submit challenge', error: error.message });
    }
};



// exports.submitChallengeCompletion = async (req, res) => {
   
//         const { userId, challengeId, description } = req.body;
//         console.log('Files received:', req.files);  // Log the files received
//         console.log('Request body:', req.body);

//         const images = req.files.map(file => `/uploads/${file.filename}`);

//         try {
//             const challenge = await EcoChallenge.findById(challengeId);
//             if (!challenge) {
//                 return res.status(404).json({ message: 'Challenge not found' });
//             }

//             // const existingCompletion = await ChallengeCompletion.findOne({ userId, challengeId, status: { $in: ['pending', 'success'] } });
//             // if (existingCompletion) {
//             //     return res.status(400).json({ message: 'Challenge submission already exists and is not denied' });
//             // }
 
//             const completion = new ChallengeCompletion({
//                 userId,
//                 challengeId,
//                 images,
//                 description,
//                 pointsAchieved: challenge.points,
//                 carbonEmission: challenge.carbonEmission,
//                 status: 'pending' 
//             });

//             await completion.save();
//             res.status(201).json({ message: 'Challenge submitted successfully', completion });
//         } catch (error) {
//             res.status(500).json({ message: 'Failed to submit challenge', error: error.message });
//         }
   
// };



// Admin update challenge status (approve or decline)
exports.updateChallengeStatus = async (req, res) => {
    const { completionId } = req.params;
    const { status } = req.body;

    try {
        const completion = await ChallengeCompletion.findById(completionId);
        if (!completion) {
            return res.status(404).json({ message: 'Challenge completion not found' });
        }

        // Update the status
        completion.status = status;

        // If success, update the user's total points
        if (status === 'success') {
            const user = await User.findById(completion.userId);
            if (user) {
                user.totalPoints = (user.totalPoints || 0) + completion.pointsAchieved;
                await user.save();
            }
        }

        await completion.save();
        res.status(200).json({ message: 'Challenge status updated', completion });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update challenge status', error: error.message });
    }
};

// Get all challenge completions by userId
exports.getChallengeCompletionsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find all challenge completions for the given userId
        const completions = await ChallengeCompletion.find({ userId });

        if (completions.length === 0) {
            return res.status(404).json({ message: 'No challenge completions found for this user' });
        }

        res.status(200).json({ message: 'Challenge completions found', completions });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get challenge completions', error: error.message });
    }
};

// Get challenge completions by userId and challengeId
exports.getChallengeCompletionsByUserAndChallenge = async (req, res) => {
    const { userId, challengeId } = req.params;

    try {
        // Find challenge completions for the given userId and challengeId
        const completions = await ChallengeCompletion.find({ userId, challengeId });

        if (completions.length === 0) {
            return res.status(404).json({ message: 'No challenge completions found for this user with the specified challenge' });
        }

        res.status(200).json({ message: 'Challenge completions found', completions });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get challenge completions', error: error.message });
    }
};

exports.getTaskStatus = async (req, res) => {
    const { userId, challengeId } = req.params;

    try {
        const completion = await ChallengeCompletion.findOne({ userId, challengeId });

        if (!completion) {
            return res.status(404).json({ message: 'Task not started yet.' });
        }

        res.status(200).json({
            status: completion.status,
            points: completion.pointsAchieved,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch task status', error: error.message });
    }
};

exports.getChallengeStatsByUser = async (req, res) => {
    console.log(`Fetching stats for userId: ${req.params.userId}`);
    const { userId } = req.params;

    try {
        const completions = await ChallengeCompletion.find({ userId, status: 'success' }).populate('challengeId');

        if (completions.length === 0) {
            return res.status(404).json({ message: 'No completed challenges found for this user' });
        }

        const totalPoints = completions.reduce((sum, comp) => sum + comp.pointsAchieved, 0);
        const lastCompletedTask = completions[completions.length - 1];
        const nextTask = await EcoChallenge.findOne({
            taskNo: { $gt: lastCompletedTask.challengeId.taskNo },
        }).sort({ taskNo: 1 });

        const badgeDetails = getBadgeDetails(totalPoints);

        const response = {
            totalPoints,
            completedTasks: completions.map(comp => ({
                name: comp.challengeId.name,
                pointsAchieved: comp.pointsAchieved,
            })),
            lastCompletedTask: {
                name: lastCompletedTask.challengeId.name,
                points: lastCompletedTask.pointsAchieved,
            },
            nextTask: nextTask ? nextTask.name : 'No upcoming task',
            badges: badgeDetails,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch challenge stats', error: error.message });
    }
};

function getBadgeDetails(totalPoints) {
    const badges = [
        { threshold: 2000, name: 'Eco Enthusiast', title: 'eco_enthusiast' },
        { threshold: 5000, name: 'Green Supporter', title: 'green_supporter' },
        { threshold: 10000, name: 'Sustainability Advocate', title: 'sustainability_advocate' },
        { threshold: 20000, name: 'Eco-Warrior', title: 'eco_warrior' },
        { threshold: 35000, name: 'Carbon Crusader', title: 'carbon_crusader' },
        { threshold: 55000, name: 'Environmental Hero', title: 'environmental_hero' },
        { threshold: 75000, name: 'Climate Champion', title: 'climate_champion' },
        { threshold: 89900, name: 'Earth Guardian', title: 'earth_guardian' },
        { threshold: Infinity, name: 'Global Eco Legend', title: 'global_eco_legend' },
    ];

    // Include badges where totalPoints is >= threshold
    const earnedBadges = badges.filter(badge => totalPoints >= badge.threshold);
    
    return {
        totalBadges: earnedBadges.length,
        badgeNames: earnedBadges.map(badge => badge.name),
        badgeTitles: earnedBadges.map(badge => badge.title), // Include titles for frontend mapping
    };
}

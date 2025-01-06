const express = require('express');
const router = express.Router();
const challengeCompletionController = require('../controllers/challengeCompletionController');

// Route to submit challenge completion with images
router.post('/submit', challengeCompletionController.uploadImages, challengeCompletionController.submitChallengeCompletion);

// Route to update challenge status (pending, success, declined)
router.patch('/update-status/:completionId', challengeCompletionController.updateChallengeStatus);

// Route to get challenge completions by userId
router.get('/completions/user/:userId', challengeCompletionController.getChallengeCompletionsByUser);

router.get('/completions/user/:userId/challenge/:challengeId', challengeCompletionController.getChallengeCompletionsByUserAndChallenge);

router.get('/status/:userId/:challengeId', challengeCompletionController.getTaskStatus);

router.get('/statusOfUser/:userId', challengeCompletionController.getChallengeStatsByUser );

module.exports = router;

const express = require('express');
const router = express.Router();
const ecoChallengeController = require('../controllers/ecoChallengeController');
const multer = require('multer');

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/ecochallenges/task');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Route to add a new eco-challenge (with image upload)
router.post('/add', upload.single('image'), ecoChallengeController.addEcoChallenge);

// Route to fetch all weekly or monthly eco-challenges
router.get('/:type', ecoChallengeController.getEcoChallenges);

// Route to get a single eco-challenge by Id
router.get('/get/:id', ecoChallengeController.getEcoChallengeById);


// Route to update a challenge by Id (with image upload)
router.put('/edit/:id', upload.single('image'), ecoChallengeController.updateEcoChallenge);

// Route to delete a challenge by Id
router.delete('/delete/:id', ecoChallengeController.deleteEcoChallenge);

module.exports = router;

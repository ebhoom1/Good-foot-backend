const express = require('express');
const router = express.Router();
const { createUserFootprint } = require('../controllers/carbonEngineController');

// Route to create the user footprint with vehicle details
router.post('/create-footprint', createUserFootprint);

module.exports = router;

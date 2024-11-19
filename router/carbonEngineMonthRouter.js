const express = require('express');
const router = express.Router();
const { calculateMonthlyCarbonFootprint, getMonthlyCarbonFootprint,getLastMonthlyCarbonFootprint, getCarbonFootprintById } = require('../controllers/monthCarbonController');

// Route to calculate the monthly carbon footprint (with userId in URL params)
router.post('/calculate/:userId', calculateMonthlyCarbonFootprint);

router.get('/:userId', getMonthlyCarbonFootprint);

router.get('/last/:userId', getLastMonthlyCarbonFootprint);

router.get('/get/:userId', getCarbonFootprintById);



module.exports = router;

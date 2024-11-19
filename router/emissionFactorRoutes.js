const express = require('express');
const router = express.Router();
const emissionFactorController = require('../controllers/emissionFactorController');

// Route to add a new emission factor
router.post('/add', emissionFactorController.addEmissionFactor);

// Route to get all emission factors
router.get('/', emissionFactorController.getEmissionFactors);

// Route to update an emission factor by ID
router.put('/update/:id', emissionFactorController.updateEmissionFactor);

// Route to delete an emission factor by ID
router.delete('/delete/:id', emissionFactorController.deleteEmissionFactor);

module.exports = router;

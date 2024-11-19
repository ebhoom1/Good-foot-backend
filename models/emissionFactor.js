const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    state: { type: String, required: true },
    emissionFactor: { type: Number, required: true } // CO2 emissions in kg CO2/kWh
});

const emissionFactorSchema = new mongoose.Schema({
    country: { type: String, required: true },
    states: [stateSchema] // Array of states with their emission factors
});

module.exports = mongoose.model('EmissionFactor', emissionFactorSchema);

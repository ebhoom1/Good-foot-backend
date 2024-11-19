const mongoose = require('mongoose');


const flightSchema = new mongoose.Schema({
    class: { type: String, required: true }, // Economy, Business, First
    hours: { type: Number, required: true }, // Duration of the flight in hours
    totalCO2EmissionsOfFlight: { type: Number, required: true } // Total CO2 emissions of the flight
});
// Schema to store monthly carbon footprint data
const monthCarbonSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    month: { type: String, required: true }, // Store month in "MM/YYYY" format
    electricityUsage: { type: Number, required: true }, // Monthly electricity usage in kWh
    vehicleUsage: [{
        type: { type: String, required: true }, // car, bike, scooter
        fuelType: { type: String, required: true }, // petrol, diesel, CNG, electric
        kilometersTraveled: { type: Number, required: true },
        totalCO2EmissionsOfVehicle: { type: Number, required: true }, // CO2 emissions for this vehicle
    }],
    totalCO2Emissions: { type: Number, required: true }, // Total CO2 emissions in kg
    country: { type: String, required: true },
    state: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('MonthCarbonEngine', monthCarbonSchema);

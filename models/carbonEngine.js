const mongoose = require('mongoose');

// Utility function to format the date as dd/mm/yyyy
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const vehicleSchema = new mongoose.Schema({
    type: { type: String, required: true }, // car, bike, or scooter
    fuelType: { type: String, required: true }, // petrol, diesel, CNG, or EV
    count: { type: Number, required: true, default: 0 }, // Number of vehicles of this type
    kilometersTraveled: { type: Number, required: true }, // Total kilometers traveled per vehicle type
    averageFuelEfficiency: { type: Number, required: true }, // Average fuel efficiency (e.g., km per liter)
    totalCO2EmissionsOfVehicle: { type: String, required: true } // Total CO2 emissions of vehicle with unit
});
const flightSchema = new mongoose.Schema({
    class: { type: String, required: true }, // Economy, Business, First
    hours: { type: Number, required: true }, // Duration of the flight in hours
    totalCO2EmissionsOfFlight: { type: String, required: true } // Total CO2 emissions of flight with unit
});
const footprintSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    startDate: { type: String, required: true, default: formatDate(new Date()) }, // Save date as dd/mm/yyyy
    totalMonths: { type: Number, required: true },
    totalWeeks: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    vehicles: [vehicleSchema], // Array of vehicles
    flights: [flightSchema],
    electricityUsage: { type: Number,  }, // Electricity usage in kWh
    totalElectricityUsage: Number,
    totalCO2EmissionsOfElectricity: { type: String, required: true, default: '0' }, // Total CO2 emissions of electricity with unit
    totalCarbonFootprint: { type: String, required: true, default: '0' }, // Calculated total carbon footprint with unit
    country: { type: String, required: true }, // Country field
    state: { type: String, required: true }, // State field
    email: { type: String, required: false }, // New field for email
    mobileNumber: { type: String, required: false } // New field for mobile number

});

module.exports = mongoose.model('Footprint', footprintSchema);

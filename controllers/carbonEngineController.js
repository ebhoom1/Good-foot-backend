const Footprint = require('../models/carbonEngine');
const EmissionFactor = require('../models/emissionFactor');

// Utility functions for date formatting and parsing
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
};

// Function to generate a unique user ID
const generateUserId = async (userName) => {
    const lastFootprint = await Footprint.findOne().sort({ _id: -1 });
    let newIdNumber = '001';

    if (lastFootprint) {
        const lastId = parseInt(lastFootprint.userId.slice(-3));
        newIdNumber = (lastId + 1).toString().padStart(3, '0');
    }

    return `${userName}-${newIdNumber}`;
};

// Calculate CO2 emissions from vehicles
const calculateCO2EmissionsOfVehicle = (vehicles) => {
    return vehicles.map(vehicle => {
        let emissionFactor = 0;

        switch (vehicle.fuelType.toLowerCase()) {
            case 'petrol':
                emissionFactor = 2.31;
                break;
            case 'diesel':
                emissionFactor = 2.68;
                break;
            case 'cng':
                emissionFactor = 1.86;
                break;
            case 'electric':
                emissionFactor = 0;
                break;
            default:
                throw new Error('Unknown fuel type');
        }

        const totalCO2EmissionsOfVehicle = (vehicle.kilometersTraveled / vehicle.averageFuelEfficiency) * emissionFactor * vehicle.count;
        return { ...vehicle, totalCO2EmissionsOfVehicle };
    });
};

// Calculate CO2 emissions for flights
const calculateCO2EmissionsOfFlight = (flights) => {
    return flights.map(flight => {
        let emissionFactor = 0;

        switch (flight.class.toLowerCase()) {
            case 'economy':
                emissionFactor = 75.05; // kg CO2 per hour
                break;
            case 'business':
                emissionFactor = 187.63; // kg CO2 per hour
                break;
            case 'first':
                emissionFactor = 225.15; // kg CO2 per hour
                break;
            default:
                throw new Error('Unknown flight class');
        }

        const totalCO2EmissionsOfFlight = flight.hours * emissionFactor;
        return { ...flight, totalCO2EmissionsOfFlight: totalCO2EmissionsOfFlight.toFixed(2) + ' kg' };
    });
};


// Fetch the emission factor from the database and calculate the total CO2 emissions of electricity
const calculateTotalCO2EmissionsOfElectricity = async (country, state, electricityUsage, totalMonths) => {
    const emissionFactorRecord = await EmissionFactor.findOne({ country });
    if (!emissionFactorRecord) {
        throw new Error(`Emission factors not found for ${country}`);
    }

    const stateData = emissionFactorRecord.states.find(s => s.state === state);
    if (!stateData) {
        throw new Error(`Emission factor not found for ${state}, ${country}`);
    }

    const totalElectricityUsage = electricityUsage * totalMonths; // Calculate total electricity usage for the period
    const totalCO2EmissionsOfElectricity = totalElectricityUsage * stateData.emissionFactor; // Store as raw value
    return { totalCO2EmissionsOfElectricity, totalElectricityUsage };
};

// Calculate the total carbon footprint
const calculateTotalCarbonFootprint = (vehicles, totalCO2EmissionsOfElectricity,flights) => {
    const vehicleCarbonFootprint = vehicles.reduce((acc, vehicle) => acc + vehicle.totalCO2EmissionsOfVehicle, 0);
    const flightCarbonFootprint = flights.length > 0 ? flights.reduce((acc, flight) => acc + parseFloat(flight.totalCO2EmissionsOfFlight), 0) : 0;    
    const total = vehicleCarbonFootprint + flightCarbonFootprint + totalCO2EmissionsOfElectricity;
    return total;
};

// Create a new user footprint
const createUserFootprint = async (req, res) => {
    const { userName, startDate, vehicles, flights = [], country, state, electricityUsage, email, mobileNumber } = req.body;

    if (!userName || !startDate || !vehicles || !country || !state || !electricityUsage) {
        return res.status(400).json({ message: 'User name, start date, country, state, electricity usage, and vehicle details are required' });
    }

    // Check if either email or mobile number exists, based on which one is provided
    if (email) {
        const existingUserWithEmail = await Footprint.findOne({ email });
        if (existingUserWithEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
    }

    if (mobileNumber) {
        const existingUserWithMobile = await Footprint.findOne({ mobileNumber });
        if (existingUserWithMobile) {
            return res.status(400).json({ message: 'Mobile number already exists' });
        }
    }

    const parsedStartDate = parseDate(startDate);
    const userId = await generateUserId(userName);
    const vehiclesWithCO2Emissions = calculateCO2EmissionsOfVehicle(vehicles);
    const flightsWithCO2Emissions = flights.length > 0 ? calculateCO2EmissionsOfFlight(flights) : [];

    const totalDays = Math.floor((new Date() - parsedStartDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = Math.floor(totalDays / 30.44);

    let totalCO2EmissionsOfElectricity, totalElectricityUsage;

    try {
        ({ totalCO2EmissionsOfElectricity, totalElectricityUsage } = await calculateTotalCO2EmissionsOfElectricity(country, state, electricityUsage, totalMonths));
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

    const totalCarbonFootprint = calculateTotalCarbonFootprint(vehiclesWithCO2Emissions, totalCO2EmissionsOfElectricity, flightsWithCO2Emissions);

    const formattedStartDate = formatDate(parsedStartDate);

    const newFootprint = new Footprint({
        userId,
        userName,
        startDate: formattedStartDate,
        totalMonths,
        totalWeeks,
        totalDays,
        vehicles: vehiclesWithCO2Emissions,
        flights: flightsWithCO2Emissions,
        electricityUsage,
        totalElectricityUsage,
        totalCO2EmissionsOfElectricity,
        totalCarbonFootprint,
        country,
        state,
        email,
        mobileNumber
    });

    try {
        await newFootprint.save();
        res.status(201).json(newFootprint);
    } catch (err) {
        res.status(500).json({ message: 'Error saving data', error: err.message });
    }
};




module.exports = { createUserFootprint };   
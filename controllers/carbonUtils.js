const EmissionFactor = require('../models/emissionFactor');  // Import the EmissionFactor model

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

// Calculate total CO2 emissions for electricity usage
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
const calculateTotalCarbonFootprint = (vehicles, totalCO2EmissionsOfElectricity) => {
    const vehicleCarbonFootprint = vehicles.reduce((acc, vehicle) => acc + vehicle.totalCO2EmissionsOfVehicle, 0);
    return vehicleCarbonFootprint + totalCO2EmissionsOfElectricity;
};

module.exports = {
    calculateCO2EmissionsOfVehicle,
    calculateTotalCO2EmissionsOfElectricity,
    calculateTotalCarbonFootprint
};

    const MonthCarbonEngine = require('../models/MonthCarbonEngine');
    const User = require('../models/User');
    const EmissionFactor = require('../models/emissionFactor');

    // Utility to calculate CO2 emissions for vehicles
    const calculateVehicleCO2Emissions = (vehicle) => {
        if (!vehicle.fuelType) {
          throw new Error('Fuel type is missing in vehicle data');
        }
      
        const fuelType = vehicle.fuelType.toLowerCase(); // Safely convert to lowercase
        let emissionFactor = 0;
      
        switch (fuelType) {
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
            throw new Error(`Unknown fuel type: ${fuelType}`);
        }
      
        if (!vehicle.kilometersTraveled || !vehicle.averageFuelEfficiency) {
          throw new Error('Missing kilometers traveled or fuel efficiency for the vehicle');
        }
      
        return (vehicle.kilometersTraveled / vehicle.averageFuelEfficiency) * emissionFactor;
      };
      
    
      const calculateFlightCO2Emissions = (flights) => {
        return flights.map(flight => {
          if (!flight.flightClass || !flight.hours) {
            throw new Error('Flight data is incomplete');
          }
      
          const flightClass = flight.flightClass.toLowerCase(); // Safely convert to lowercase
          let emissionFactor = 0;
      
          switch (flightClass) {
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
              throw new Error(`Unknown flight class: ${flightClass}`);
          }
      
          const totalCO2EmissionsOfFlight = flight.hours * emissionFactor;
          return { ...flight, totalCO2EmissionsOfFlight: totalCO2EmissionsOfFlight.toFixed(2) };
        });
      };
      
    
// Utility to convert dd/mm/yyyy to Date object
const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/'); // Split the date string into day, month, year
    return new Date(`${year}-${month}-${day}`);       // Create a new Date object in the correct format
};

// Utility function to format date to MM/YYYY
const formatMonthYear = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 because months are zero-indexed
    const year = date.getFullYear();
    return `${month}/${year}`;
};

    // Function to calculate the monthly carbon footprint
    // Function to calculate the monthly carbon footprint
    const calculateMonthlyCarbonFootprint = async (req, res) => {
        const { startDate, electricityUsage, vehicleUsage,flightUsage  } = req.body;
        const { userId } = req.params;  // Get userId from URL params
    
        try {
            // Parse the provided startDate (dd/mm/yyyy) into a valid Date object
            const start = parseDate(startDate);
            if (isNaN(start)) {
                return res.status(400).json({ message: 'Invalid date format. Please use dd/mm/yyyy.' });
            }
    
            const month = formatMonthYear(start); // Format the start date to MM/YYYY
    
            // Check if a record already exists for the same month and year
            const existingRecord = await MonthCarbonEngine.findOne({ userId, month });
            if (existingRecord) {
                return res.status(400).json({ message: 'Carbon footprint for this month already exists' });
            }
    
            // Calculate the endDate by adding 1 month to the startDate
            const endDate = new Date(start);
            endDate.setMonth(endDate.getMonth() + 1);
    
            // Fetch user details by userId
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            const country = user.carbonFootprint.country;
            const state = user.carbonFootprint.state;
    
            // Fetch emission factor for the user's country and state
            const emissionFactorRecord = await EmissionFactor.findOne({ country });
            if (!emissionFactorRecord) {
                return res.status(404).json({ message: `Emission factor not found for country: ${country}` });
            }
    
            const stateEmissionFactor = emissionFactorRecord.states.find(s => s.state === state);
            if (!stateEmissionFactor) {
                return res.status(404).json({ message: `Emission factor not found for state: ${state}, ${country}` });
            }
    
            // Calculate CO2 emissions for electricity
            const totalElectricityCO2 = electricityUsage * stateEmissionFactor.emissionFactor;
    
            // Calculate CO2 emissions for each vehicle
            const vehicleEmissions = vehicleUsage.map(vehicle => {
                const co2Emissions = calculateVehicleCO2Emissions(vehicle);
                return { ...vehicle, totalCO2EmissionsOfVehicle: co2Emissions };
            });

            const flightsWithCO2Emissions = calculateFlightCO2Emissions(flightUsage || []);
    
            // Calculate total CO2 emissions
            const totalVehicleCO2 = vehicleEmissions.reduce((sum, vehicle) => sum + vehicle.totalCO2EmissionsOfVehicle, 0);
            const totalFlightCO2 = flightsWithCO2Emissions.reduce((sum, flight) => sum + parseFloat(flight.totalCO2EmissionsOfFlight), 0);
            const totalCO2Emissions = totalElectricityCO2 + totalVehicleCO2 + totalFlightCO2;

            // Save the monthly carbon footprint data
            const newMonthCarbon = new MonthCarbonEngine({
                userId: user._id,
                userName: user.username, 
                startDate: start,        // Save the parsed start date
                endDate: endDate,        // Save the calculated end date
                month: month,            // Save the formatted month in MM/YYYY format
                electricityUsage,
                vehicleUsage: vehicleEmissions,
                flightUsage: flightsWithCO2Emissions,
                totalCO2Emissions,
                country,
                state,
            });
    
            await newMonthCarbon.save();
    
            // Update user document to track monthly CO2 emissions in an array
            user.carbonFootprintHistory = user.carbonFootprintHistory || [];
            user.carbonFootprintHistory.push({ month, totalCO2Emissions });
            await user.save();
    
            return res.status(201).json({ message: 'Monthly carbon footprint calculated successfully', newMonthCarbon });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };
    

    // Function to get the monthly carbon footprint by userId and specific month
    const getMonthlyCarbonFootprint = async (req, res) => {
        const { userId } = req.params;
        const { month } = req.body; // Get the month from the request body

        try {
            // Find the monthly carbon footprint by userId and month
            const carbonFootprint = await MonthCarbonEngine.findOne({ userId, month });
            if (!carbonFootprint) {
                return res.status(404).json({ message: 'No carbon footprint found for this month' });
            }

            return res.status(200).json(carbonFootprint);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };


    const getLastMonthlyCarbonFootprint = async (req, res) => {
        const { userId } = req.params; // Get userId from params

        try {
            // Find the most recent monthly carbon footprint by userId
            const lastCarbonFootprint = await MonthCarbonEngine
                .findOne({ userId })  // Filter by userId only
                .sort({ _id: -1 });    // Sort by _id in descending order (most recent first)

            if (!lastCarbonFootprint) {
                return res.status(404).json({ message: 'No carbon footprint record found for this user' });
            }

            // Return the most recent record
            return res.status(200).json(lastCarbonFootprint);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };


    const getCarbonFootprintById = async (req, res) => {
        const { userId } = req.params; // Get userId from params

        try {
            // Find the most recent monthly carbon footprint by userId
            const CarbonFootprint = await MonthCarbonEngine
                .findOne({ userId })  // Filter by userId only
                
            if (!CarbonFootprint) {
                return res.status(404).json({ message: 'No carbon footprint record found for this user' });
            }

            // Return the most recent record
            return res.status(200).json(CarbonFootprint);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };


    module.exports = {
        calculateMonthlyCarbonFootprint,
        getMonthlyCarbonFootprint,
        getLastMonthlyCarbonFootprint,
        getCarbonFootprintById
    };

const EmissionFactor = require('../models/emissionFactor');

const addEmissionFactor = async (req, res) => {
    const { country, states } = req.body;

    if (!country || !states || !Array.isArray(states) || states.length === 0) {
        return res.status(400).json({ message: 'Country and states with emission factors are required' });
    }

    try {
        const newEmissionFactor = new EmissionFactor({ country, states });
        await newEmissionFactor.save();
        res.status(201).json(newEmissionFactor);
    } catch (err) {
        res.status(500).json({ message: 'Error saving emission factor', error: err.message });
    }
};

const getEmissionFactors = async (req, res) => {
    try {
        const emissionFactors = await EmissionFactor.find();
        res.status(200).json(emissionFactors);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching emission factors', error: err.message });
    }
};

const updateEmissionFactor = async (req, res) => {
    const { id } = req.params;
    const { country, states } = req.body;

    if (!country || !states || !Array.isArray(states) || states.length === 0) {
        return res.status(400).json({ message: 'Country and states with emission factors are required' });
    }

    try {
        const updatedEmissionFactor = await EmissionFactor.findByIdAndUpdate(
            id,
            { country, states },
            { new: true }
        );
        if (!updatedEmissionFactor) {
            return res.status(404).json({ message: 'Emission factor not found' });
        }
        res.status(200).json(updatedEmissionFactor);
    } catch (err) {
        res.status(500).json({ message: 'Error updating emission factor', error: err.message });
    }
};

const deleteEmissionFactor = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEmissionFactor = await EmissionFactor.findByIdAndDelete(id);
        if (!deletedEmissionFactor) {
            return res.status(404).json({ message: 'Emission factor not found' });
        }
        res.status(200).json({ message: 'Emission factor deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting emission factor', error: err.message });
    }
};

module.exports = {
    addEmissionFactor,
    getEmissionFactors,
    updateEmissionFactor,
    deleteEmissionFactor
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },  // New field for profile image
    dateOfBirth: { type: Date },  // New field for date of birth
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },  // New field for address
    carbonFootprint: {
        totalCO2Emissions: { type: Number, default: 0 },
        vehicles: { type: Array, default: [] },
        electricityUsage: { type: Number, default: 0 },
        DateFromCalculated: { type: String },
        country: { type: String },
        state: { type: String },
    },
     // Add this array to track carbon footprint history
     carbonFootprintHistory: [
        {
            month: { type: String },  // Store the month in MM/YYYY format
            totalCO2Emissions: { type: Number }  // Store total emissions for that month
        }
    ],
    totalPoints: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.comparePassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

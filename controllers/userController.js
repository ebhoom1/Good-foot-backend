const User = require('../models/User');
const Footprint = require('../models/carbonEngine'); // Import Footprint model
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profileImage'); // Save to 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

// Image upload handler
const upload = multer({ storage });

exports.uploadProfileImage = upload.single('profileImage');



// Function to dynamically select client ID
const getGoogleClientId = (platform) => {
    if (platform === 'ios') {
        return process.env.IOS_CLIENT_ID;
    } else if (platform === 'android') {
        return process.env.ANDROID_CLIENT_ID;
    } else {
        return process.env.WEB_CLIENT_ID; // Fallback for web or expo clients
    }
};


// Function to check for existing carbon footprint data based on email or mobile number
const findExistingCarbonFootprint = async (email, mobileNumber) => {
    let footprint = null;
    
    // Check if email exists in the carbon footprint database
    if (email) {
        footprint = await Footprint.findOne({ email });
    }
    
    // Check if mobileNumber exists in the carbon footprint database
    if (mobileNumber && !footprint) {  // Ensure no email match before checking mobile
        footprint = await Footprint.findOne({ mobileNumber });
    }
    
    return footprint;
};

// Register with email/password
exports.register = async (req, res) => {
    try {
        const { username, email, password, mobileNumber } = req.body;
        
        // Check if either email or mobileNumber exists in the carbon footprint database
        const existingFootprint = await findExistingCarbonFootprint(email, mobileNumber);

        // Create a new user
        const user = await User.create({ username, email, password, mobileNumber });

        // If an existing footprint is found, associate it with the user
        if (existingFootprint) {
            user.carbonFootprint = {
                totalCO2Emissions: existingFootprint.totalCarbonFootprint,
                vehicles: existingFootprint.vehicles,
                electricityUsage: existingFootprint.electricityUsage,
                DateFromCalculated:existingFootprint.startDate,
                country:existingFootprint.country,
                state:existingFootprint.state,
            };
            
            // Explicitly save the updated user with the carbon footprint
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({ success: true, token, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


// Google login
exports.googleLogin = async (req, res) => {
    const { token,platform } = req.body;

    try {
        const clientId = getGoogleClientId(platform);
        const client = new OAuth2Client(clientId);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience:clientId,
        });
        const { name, email } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            // Check if there's existing carbon footprint data before creating the user
            const existingFootprint = await findExistingCarbonFootprint(email, null);

            user = await User.create({ username: name, email, password: 'google-auth-user' });

            // If existing footprint is found, associate it with the user
            if (existingFootprint) {
                user.carbonFootprint = {
                    totalCO2Emissions: existingFootprint.totalCarbonFootprint,
                    vehicles: existingFootprint.vehicles,
                    electricityUsage: existingFootprint.electricityUsage
                };
            }
        }

        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token: jwtToken, user });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Google login failed' });
    }
};

// Login with email/password
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get the authenticated user's details
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude the password field
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user by username
exports.getUserByName = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Edit user by username (PATCH)
exports.editUserByUsername = async (req, res) => {
    const { username } = req.params;  // Current username from URL
    const { newUsername, email, profileImage, dateOfBirth, address } = req.body;  // Fields from request body

    try {
        // Find the user by current username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Log the request body for debugging
        console.log("Request Body:", req.body);

        // Update the username if provided
        if (newUsername && newUsername !== username) {
            // Ensure the new username doesn't already exist
            const existingUser = await User.findOne({ username: newUsername });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already taken' });
            }
            user.username = newUsername;
        }

        // Update the email if provided
        if (email && email !== user.email) {
            // Ensure the new email doesn't already exist
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        // Update profileImage, dateOfBirth, and address if provided
        if (profileImage) user.profileImage = profileImage;
        if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
        if (address) user.address = address;

        // Save the updated user
        await user.save();

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Delete user by username (DELETE)
exports.deleteUserByUsername = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOneAndDelete({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change user password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Find the authenticated user by their ID
        const user = await User.findById(req.user.id);

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the current password matches the user's existing password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update the password with the new one
        user.password = newPassword; // This will automatically hash the password in the `pre-save` hook
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

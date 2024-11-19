const express = require('express');
const {
    register,
    login,
    googleLogin,
    getUser,
    getUserByName,
    editUserByUsername,
    deleteUserByUsername,
    getAllUsers,
    changePassword,
    uploadProfileImage,
    
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

// Protected routes
router.get('/me', auth, getUser); // Get authenticated user
router.get('/username/:username', getUserByName); // Get user by username
router.get('/all-users', getAllUsers); // Get all users (admin-only route or protected if needed)
router.patch('/edit-profile/:username', uploadProfileImage, editUserByUsername);
router.delete('/username/:username', deleteUserByUsername); // Delete user by username
router.patch('/change-password', auth, changePassword);

module.exports = router;

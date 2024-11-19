const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const DB = require('./config/DB');  // Adjust the path if necessary
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Initialize MongoDB connection
DB();

// Middleware to parse JSON
app.use(express.json());

// Configure CORS to allow requests from any origin
// Middleware
app.use(cors({
    origin: ['http://192.168.20.3:4444'],
    credentials: true
}));

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up routes
const carbonEngineRoutes = require('./router/carbonEngine');
app.use('/api/carbon-engine', carbonEngineRoutes);

// Set up emission factor routes
const emissionFactorRoutes = require('./router/emissionFactorRoutes');
app.use('/api/emission-factors', emissionFactorRoutes);

const ecoChallengeRoutes = require('./router/ecoChallengeRoutes');
const challengeCompletionRoutes = require('./router/challengeCompletionRoutes');


const userRoutes = require('./router/userRouter');
const chatRoutes = require('./router/chatRoutes');
const messageRoutes = require('./router/messageRoutes');
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/eco-challenges', ecoChallengeRoutes);
app.use('/api/challenge-completion', challengeCompletionRoutes);

const carbonEngineMonthRoutes = require('./router/carbonEngineMonthRouter');
app.use('/api/carbon-engine-month', carbonEngineMonthRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

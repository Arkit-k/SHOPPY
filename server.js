const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { User, Course } = require('./models/db'); // Import models
const jwt = require('jsonwebtoken');
const path = require('path');
const sync = require('./models/db');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const courseRoutes = require('./routes/route');
const authRoutes = require('./routes/auth');
const { isAuthenticated } = require("./middleware/middleware");
const Razorpay = require('razorpay');
const paymentRoutes = require('./routes/payment')

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');



// Set the views directory if you are not using the default location (views/)
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(bodyParser.json());
app.use(express.json());  // For parsing JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
      origin: 'http://localhost:3000',  // Your frontend URL
      credentials: true,  // Allow cookies to be sent
    }));
app.use(express.static('public')); // Assuming the images are in the 'public' directory



// Constants
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;



// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }) // Added useUnifiedTopology option
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));


//  Routes
app.use('/auth', authRoutes);
app.use('/courses',isAuthenticated, courseRoutes);
app.use('/payment', paymentRoutes);


// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

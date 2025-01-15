const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Define the route for the homepage
router.get('/', authController.homePage);

// Get signup page
router.get('/signup', authController.getSignupPage);

// Route to handle user signup
router.post('/signup', authController.signupUser);

// Get login page
router.get('/login', authController.getLoginPage);

// Route to handle user login
router.post('/login', authController.loginUser);

// Logout function
router.get('/logout', authController.logoutUser);

module.exports = router;  // Only export once


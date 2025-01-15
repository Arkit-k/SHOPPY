const jwt = require('jsonwebtoken');
const { User } = require('../models/db');
const JWT_SECRET = process.env.JWT_SECRET;  // Ensure you're using the correct secret here

// Home page check for JWT token
exports.homePage = (req, res) => {
    const token = req.cookies.token;

    if (token) {
        // Use the correct secret for verification
        jwt.verify(token, JWT_SECRET, (err, decoded) => {  // Updated here to use JWT_SECRET
            if (err) {
                console.error("Token verification failed", err);
                return res.redirect('/signup'); // Redirect to signup if token is invalid
            }

            req.user = decoded;  // Set the decoded user data
            res.redirect('/todo');  // Redirect to todo page after successful verification
        });
    } else {
        res.redirect('/signup');  // If no token, redirect to signup
    }
};

// Get signup page
exports.getSignupPage = (req, res) => {
    res.render('sign-up');
};

// Handle user signup
exports.signupUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use.' });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        res.redirect('/login');  // Redirect after successful user creation
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed: ' + err.message });
        }

        res.status(500).json({ error: 'Error creating user: ' + err.message });
    }
};

// Get login page
exports.getLoginPage = (req, res) => {
    res.render('sign-in');
};

// Handle user login
exports.loginUser = async (req, res) => {
      console.log("Login attempt:", req.body);  // Log login request body
  
      const { identifier, password } = req.body;
  
      // Check if required fields are present
      if (!identifier || !password) {
          return res.status(400).json({ error: 'All fields are required.' });
      }
  
      try {
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
          let user;
  
          // Find the user either by email or username
          if (isEmail) {
              user = await User.findOne({ email: identifier });
          } else {
              user = await User.findOne({ username: identifier });
          }
  
          if (!user) {
              return res.status(400).json({ error: 'Invalid username/email or password.' });
          }
  
          // Compare passwords
          const isMatch = await user.comparePassword(password);
          if (!isMatch) {
              return res.status(400).json({ error: 'Invalid username/email or password.' });
          }
  
          // Generate JWT token
          const token = jwt.sign(
              { userId: user._id, username: user.username },
              process.env.JWT_SECRET,  // Ensure you're using the correct environment variable
              { expiresIn: '1h' }
          );
  
          // Set the JWT token in a secure cookie
          res.cookie('auth_token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',  // Ensure this is set to 'true' in production
              maxAge: 60 * 60 * 1000,  // 1 hour expiry
          });
  
          // Redirect user to '/all' (list of courses)
          // You can also send purchased courses information if needed
          const purchasedCourses = user.purchasedCourses;
  
          res.status(200).json({
              message: 'Login successful',
              token,
              purchasedCourses, // Send back the list of purchased courses
              redirectTo: '/all' // Indicate where the user should be redirected
          });
  
      } catch (err) {
          console.error('Login error:', err);
          res.status(500).json({ error: 'An error occurred. Please try again later.' });
      }
  };
  
  
  

// Logout function
exports.logoutUser = (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // Ensure secure cookie clearing in production
        sameSite: 'strict',
    });
    res.redirect('/login');  // Redirect to login page
};

  

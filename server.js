const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { User, Todo } = require('./db'); // Import models
const jwt = require('jsonwebtoken');
const path = require('path');
const sync = require('./db');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');


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

const authenticateToken = (req, res, next) => {
      const token = req.cookies.auth_token; // Get the token from cookies
      if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });
    
      try {
        const verified = jwt.verify(token, JWT_SECRET); // Verify the token
        req.user = verified; // Add the decoded payload to the request object
        next(); // Proceed to the next middleware
      } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
      }
    };

// Home Route
app.get('/', (req, res) => {
      // Check if the JWT token exists in the cookies
      const token = req.cookies.token;
    
      if (token) {
        // Verify the token using the secret key
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
          if (err) {
            console.error("Token verification failed", err);
            return res.redirect('/signup'); // If token is invalid, redirect to signup
          }
    
          // If token is valid and user is authenticated, proceed to todo page
          req.user = decoded;  // Set the user info from the decoded token
          res.redirect('/todo');
        });
      } else {
        // If no token is found, redirect to the signup page
        res.redirect('/signup');
      }
});

app.get('/signup', (req, res) => {
      res.render('sign-up');
});                     

// Create a User
app.post('/signup', async (req, res) => {
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
    
        // Redirect after successful user creation
        res.redirect('/login');
      } catch (err) {
        console.error(err);
    
        if (err.name === 'ValidationError') {
          return res.status(400).json({ error: 'Validation failed: ' + err.message });
        }
    
        res.status(500).json({ error: 'Error creating user: ' + err.message });
      }
    });

app.get('/login', (req, res) => {
      res.render('sign-in');
});

app.post('/login', async (req, res) => {
      const { identifier, password } = req.body;
    
      if (!identifier || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
    
      try {
        // Find user by either username or email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    let user;
    if (isEmail) {
      // Find user by email if it's an email
      user = await User.findOne({ email: identifier });
    } else {
      // Otherwise, find by username
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
    
        // Generate JWT
        const token = jwt.sign(
          { userId: user._id, username: user.username },
          JWT_SECRET,
          { expiresIn: '1h' } // Token expires in 1 hour
        );
    
        // Set the token as an HTTP-only cookie
        res.cookie('auth_token', token, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
          maxAge: 60 * 60 * 1000, // 1 hour
        });
    
        res.status(200).json({ message: 'Login successful!' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
      }
    });

    app.get('/todo', authenticateToken, async (req, res) => {
      try {
        const user = await User.findById(req.user.userId);  // Find user by ID from JWT
    
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        // Render the 'todo' page with the user's username
        res.render('todos', {
          username: user.username, // Pass the username to the EJS template
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving user data' });
      }
    });

    app.get('/logout', (req, res) => {
      res.clearCookie('auth_token');  // Clear the JWT cookie
      res.redirect('/login');         // Redirect to login page after logout
    });
    

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

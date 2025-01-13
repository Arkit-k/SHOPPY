const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB


// Define User Schema
const userSchema = new mongoose.Schema({
      username: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/, // Email validation regex
      },
      password: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    });
    
    // Pre-save hook to hash the password before saving it to the database
    userSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next(); // Only hash if password is modified
      try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next(); // Proceed to save
      } catch (error) {
        next(error); // Handle error
      }
    });
    
    // Method to compare password for authentication
    userSchema.methods.comparePassword = async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password); // Compare passwords
    };
    

// Define Todo Schema
const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create Models
const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

// Export Models
module.exports = {
  User,
  Todo,
};

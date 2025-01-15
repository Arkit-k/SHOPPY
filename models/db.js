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
      purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedCourse' }]
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

const videoSchema = new mongoose.Schema({
      title: 
      { type: String, 
        required: true },
      videoUrl: 
      { type: String, 
        required: false },
      thumbnail: { 
          type: String, 
          required: false  // Optional thumbnail URL
        }
    });
    

// Define Todo Schema
const courseSchema = new mongoose.Schema({
  title: 
  { type: String, 
    required: true },
  description: 
  { type: String, 
    required: true },
  price: 
  { type: Number, 
    required: true },
  imageUrl: 
  { type: String, 
    required: true },
  videos: 
  { type: [videoSchema], 
    required: true },
});

const purchasedCourseSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Reference to User model
      required: true
  },
  course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',  // Reference to Course model
      required: true
  },
  purchaseDate: {
      type: Date,
      default: Date.now
  },
  paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
  },
  transactionId: {
      type: String,
      required: false
  },
  orderId: {
        type: String, // Order ID from Razorpay
        required: true
    },
    signature: {
        type: String, // Signature from Razorpay for verification
        required: true
    },
  amount: {
      type: Number,
      required: true
  },
  paymentMethod: {
      type: String,
      enum: ['razorpay', 'other'],  // Example payment methods
      default: 'razorpay'
  }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const PurchasedCourse = mongoose.model('PurchasedCourse', purchasedCourseSchema);

// Export Models
module.exports = {
  User,
  Course,
  PurchasedCourse
};

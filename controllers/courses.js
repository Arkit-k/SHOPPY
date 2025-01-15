// controllers/courses.js
const { Course , User } = require('../models/db'); // Assuming a Mongoose model

// Create a new course
exports.createCourse = async (req, res) => {
      const { title, description, price, imageUrl } = req.body;
      
      // Validate course fields
      if (!title || !description || !price || !imageUrl) {
          return res.status(400).json({
              error: "Course validation failed: title, description, price, and imageUrl are required."
          });
      }
      
      try {
          const newCourse = new Course({ title, description, price, imageUrl });
          await newCourse.save();
          res.status(201).json({ message: 'Course created successfully.' });
      } catch (err) {
          console.error('Error creating course:', err);
          res.status(500).json({ error: 'Error creating course.' });
      }
  };
  

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses', message: error.message });
    }
};

// Update a course by ID
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course', message: error.message });
    }
};

// Delete a course by ID
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCourse = await Course.findByIdAndDelete(id);

        if (!deletedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Failed to delete course', message: error.message });
    }
};

exports.getCourseVideos = async (req, res) => {
      const { courseId } = req.params;
      const user = await User.findById(req.user.id);
  
      if (!user || !user.purchasedCourses.includes(courseId)) {
          return res.status(403).json({ error: 'You need to purchase the course first' });
      }
  
      // Fetch and return the course videos
      const course = await Course.findById(courseId);
      res.json({ videos: course.videos });
  };


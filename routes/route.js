const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courses');
const { isAuthenticated } = require('../middleware/middleware');

// Define routes
router.post('/create', isAuthenticated, courseController.createCourse);

// Get all courses (authenticated users only)
router.get('/all', isAuthenticated, courseController.getAllCourses);

// Update a course by ID (authenticated users only)
router.put('/:id', isAuthenticated, courseController.updateCourse);

// Delete a course by ID (authenticated users only)
router.delete('/:id', isAuthenticated, courseController.deleteCourse);

module.exports = router;


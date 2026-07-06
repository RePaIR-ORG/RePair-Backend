import express from 'express';
import { addStudent, getStudents, getStudentById } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/students
// @desc    Add a new student
// @access  Private
router.post('/', protect, addStudent);

// @route   GET /api/students
// @desc    Get all students with pagination
// @access  Private
router.get('/', protect, getStudents);

// @route   GET /api/students/:id
// @desc    Get a single student's full profile
// @access  Private
router.get('/:id', protect, getStudentById);

export default router;

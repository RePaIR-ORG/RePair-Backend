import express from 'express';
import { studentLogin, getStudentMe, getStudentTasks } from '../controllers/studentAuthController.js';
import { protectStudent } from '../middleware/studentAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', studentLogin);

// Protected routes (student JWT required)
router.get('/me', protectStudent, getStudentMe);
router.get('/tasks', protectStudent, getStudentTasks);

export default router;

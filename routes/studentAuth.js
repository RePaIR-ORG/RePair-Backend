import express from 'express';
import { studentLogin, getStudentMe, getStudentTasks, completeTask } from '../controllers/studentAuthController.js';
import { protectStudent } from '../middleware/studentAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', studentLogin);

// Protected routes (student JWT required)
router.get('/me',                               protectStudent, getStudentMe);
router.get('/tasks',                            protectStudent, getStudentTasks);
router.patch('/tasks/:taskId/complete',         protectStudent, completeTask);

export default router;


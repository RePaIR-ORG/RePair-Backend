import express from 'express';
import { addStudent, getStudents, getStudentById, saveAssessmentResult, getStudentMoodHistory } from '../controllers/studentController.js';
import { getStudentCredentials, setStudentCredentials } from '../controllers/studentCredentialsController.js';
import { protect } from '../middleware/authMiddleware.js';
import taskRoutes from './tasks.js';

const router = express.Router();

router.post('/',                      protect, addStudent);
router.get('/',                       protect, getStudents);
router.get('/:id',                    protect, getStudentById);
router.patch('/:id/assessment',       protect, saveAssessmentResult);
router.get('/:id/credentials',        protect, getStudentCredentials);
router.patch('/:id/credentials',      protect, setStudentCredentials);
router.get('/:id/mood-history',       protect, getStudentMoodHistory);

// Nested task routes: /api/students/:studentId/tasks
router.use('/:studentId/tasks', taskRoutes);

export default router;



import express from 'express';
import { addStudent, getStudents, getStudentById, saveAssessmentResult } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/',                      protect, addStudent);
router.get('/',                       protect, getStudents);
router.get('/:id',                    protect, getStudentById);
router.patch('/:id/assessment',       protect, saveAssessmentResult);

export default router;


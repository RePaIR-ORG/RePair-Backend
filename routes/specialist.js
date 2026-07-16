import express from 'express';
import { getProgressOverview, getStudentProgress } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/specialist/progress-overview  — aggregated across all students
router.get('/progress-overview', protect, getProgressOverview);

// GET /api/specialist/students/:studentId/progress  — single student detail
router.get('/students/:studentId/progress', protect, getStudentProgress);

export default router;


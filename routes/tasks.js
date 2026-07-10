import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadTaskImage } from '../middleware/taskUploadMiddleware.js';

// Mounted at: /api/students/:studentId/tasks
// (mergeParams: true allows access to :studentId from the parent router)
const router = express.Router({ mergeParams: true });

router.get('/',           protect,                      getTasks);
router.post('/',          protect, uploadTaskImage,     createTask);
router.patch('/:taskId',  protect, uploadTaskImage,     updateTask);
router.delete('/:taskId', protect,                      deleteTask);

export default router;


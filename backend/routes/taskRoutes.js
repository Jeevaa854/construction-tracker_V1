import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  addAttachment,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);

router.get('/', getTasks);

router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('deadline').isISO8601().withMessage('A valid deadline is required'),
  ],
  validate,
  createTask
);

router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  addComment
);

router.post('/:id/attachments', upload.single('file'), addAttachment);

export default router;

import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getProgressLogs,
  getProgressLogById,
  createProgressLog,
  updateProgressLog,
  addSitePhoto,
  deleteProgressLog,
} from '../controllers/progressController.js';

const router = express.Router();

router.use(protect);

router.get('/', getProgressLogs);

router.post(
  '/',
  [
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('type').isIn(['daily', 'weekly']).withMessage('Type must be daily or weekly'),
    body('workSummary').trim().notEmpty().withMessage('Work summary is required'),
    body('completionPercentage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Completion percentage must be between 0 and 100'),
  ],
  validate,
  createProgressLog
);

router.get('/:id', getProgressLogById);
router.put('/:id', updateProgressLog);
router.delete('/:id', authorize('admin', 'manager'), deleteProgressLog);
router.post('/:id/photos', upload.single('photo'), addSitePhoto);

export default router;

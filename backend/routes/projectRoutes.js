import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignWorkers,
} from '../controllers/projectController.js';

const router = express.Router();

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('manager').isMongoId().withMessage('A valid manager id is required'),
    body('startDate').isISO8601().withMessage('A valid start date is required'),
    body('endDate').isISO8601().withMessage('A valid end date is required'),
    body('estimatedBudget')
      .isFloat({ min: 0 })
      .withMessage('Estimated budget must be a positive number'),
  ],
  validate,
  createProject
);

router.get('/:id', getProjectById);

router.put('/:id', authorize('admin', 'manager'), updateProject);

router.delete('/:id', authorize('admin'), deleteProject);

router.put(
  '/:id/workers',
  authorize('admin', 'manager'),
  [body('workers').isArray().withMessage('workers must be an array')],
  validate,
  assignWorkers
);

export default router;

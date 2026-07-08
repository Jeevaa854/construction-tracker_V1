import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  addMaintenanceRecord,
} from '../controllers/resourceController.js';

const router = express.Router();

router.use(protect);

router.get('/', getResources);

router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Resource name is required'),
    body('type')
      .isIn(['equipment', 'material', 'tool', 'vehicle'])
      .withMessage('Invalid resource type'),
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
  ],
  validate,
  createResource
);

router.get('/:id', getResourceById);
router.put('/:id', authorize('admin', 'manager'), updateResource);
router.delete('/:id', authorize('admin', 'manager'), deleteResource);

router.post(
  '/:id/maintenance',
  authorize('admin', 'manager'),
  [
    body('date').isISO8601().withMessage('A valid date is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  addMaintenanceRecord
);

export default router;

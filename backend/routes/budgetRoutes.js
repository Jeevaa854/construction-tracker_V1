import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getBudgetByProject,
  createBudget,
  updateBudget,
  getExpenses,
  createExpense,
  updateExpenseStatus,
  deleteExpense,
} from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

// --- Budget plan ---
router.get('/project/:projectId', getBudgetByProject);

router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('totalEstimated')
      .isFloat({ min: 0 })
      .withMessage('Total estimated budget must be a positive number'),
  ],
  validate,
  createBudget
);

router.put('/:id', authorize('admin', 'manager'), updateBudget);

// --- Expenses ---
router.get('/expenses', getExpenses);

router.post(
  '/expenses',
  authorize('admin', 'manager'),
  [
    body('project').isMongoId().withMessage('A valid project id is required'),
    body('category')
      .isIn(['labor', 'materials', 'equipment', 'permits', 'transportation', 'miscellaneous'])
      .withMessage('Invalid expense category'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  ],
  validate,
  createExpense
);

router.put(
  '/expenses/:id/status',
  authorize('admin', 'manager'),
  [
    body('approvalStatus')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid approval status'),
  ],
  validate,
  updateExpenseStatus
);

router.delete('/expenses/:id', authorize('admin', 'manager'), deleteExpense);

export default router;

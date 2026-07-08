import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateAvatar,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect); // every route below requires authentication

router.get('/', authorize('admin', 'manager'), getUsers);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'worker'])
      .withMessage('Role must be admin, manager, or worker'),
  ],
  validate,
  createUser
);

router.put('/me/avatar', upload.single('avatar'), updateAvatar);

router.get('/:id', authorize('admin', 'manager'), getUserById);

router.put(
  '/:id',
  [
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'worker'])
      .withMessage('Role must be admin, manager, or worker'),
  ],
  validate,
  updateUser
);

router.delete('/:id', authorize('admin'), deleteUser);

export default router;

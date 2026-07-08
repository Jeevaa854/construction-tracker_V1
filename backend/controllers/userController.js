import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

/**
 * @desc    Get all users with search + pagination (admin/manager only)
 * @route   GET /api/v1/users?search=&role=&page=&limit=
 * @access  Private (admin, manager)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

/**
 * @desc    Get a single user by id
 * @route   GET /api/v1/users/:id
 * @access  Private (admin, manager)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({ success: true, user });
});

/**
 * @desc    Create a user directly (admin only) - can assign any role
 * @route   POST /api/v1/users
 * @access  Private (admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone, role });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
});

/**
 * @desc    Update a user's profile fields (and role, if admin)
 * @route   PUT /api/v1/users/:id
 * @access  Private (admin, manager for own profile / limited fields; self)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isSelf = req.user._id.toString() === user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this user');
  }

  const { name, phone, notificationPreferences, darkMode, role, isActive } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (notificationPreferences !== undefined) {
    user.notificationPreferences = {
      ...user.notificationPreferences.toObject(),
      ...notificationPreferences,
    };
  }
  if (darkMode !== undefined) user.darkMode = darkMode;

  // Only an admin may change role or activation status, and never on themselves
  // (prevents an admin locking themselves out).
  if (isAdmin && !isSelf) {
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  });
});

/**
 * @desc    Upload/replace the logged-in user's avatar
 * @route   PUT /api/v1/users/me/avatar
 * @access  Private
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image uploaded');
  }

  const user = await User.findById(req.user._id);

  // Remove the old avatar from Cloudinary, if one exists, to avoid orphaned files.
  if (user.avatar?.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (error) {
      console.error(`Failed to delete old avatar: ${error.message}`);
    }
  }

  user.avatar = { url: req.file.path, publicId: req.file.filename };
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    user,
  });
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

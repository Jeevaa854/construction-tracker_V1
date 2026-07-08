import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Allow role selection during registration. In production, restrict admin/manager
  // registration via email verification, invitation codes, or role promotion endpoints.
  const validRoles = ['worker', 'manager', 'admin'];
  const normalizedRole = role && typeof role === 'string' ? role.toLowerCase().trim() : '';
  const safeRole = validRoles.includes(normalizedRole) ? normalizedRole : 'worker';

  console.log('Register request - role:', role, 'normalized:', normalizedRole, 'final:', safeRole);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: safeRole,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user,
  });
});

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user,
  });
});

/**
 * @desc    Logout (client discards token; endpoint kept for symmetry
 *          and to support future token-blacklisting/session logging)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

/**
 * @desc    Request a password reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Respond with success regardless of whether the user exists,
  // to avoid leaking which emails are registered.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset for your Construction Tracker account.
         Click the button below to set a new password. This link expires in
         ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 15} minutes.</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:10px 20px;background:#2563eb;
                  color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Construction Tracker - Password Reset',
      html,
    });

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent',
    });
  } catch (error) {
    // Roll back the token so a failed email doesn't leave a dangling reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Email could not be sent, please try again later');
  }
});

/**
 * @desc    Reset password using the token emailed to the user
 * @route   PUT /api/v1/auth/reset-password/:resetToken
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token,
  });
});

/**
 * @desc    Change password while logged in
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

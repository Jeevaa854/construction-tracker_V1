import asyncHandler from 'express-async-handler';
import Progress from '../models/Progress.js';
import Project from '../models/Project.js';

/**
 * @desc    Get progress logs for a project
 * @route   GET /api/v1/progress?project=&type=&page=&limit=
 * @access  Private
 */
export const getProgressLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.type) filter.type = req.query.type;

  const [logs, total] = await Promise.all([
    Progress.find(filter)
      .populate('submittedBy', 'name email avatar')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Progress.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    logs,
  });
});

/**
 * @desc    Get a single progress log
 * @route   GET /api/v1/progress/:id
 * @access  Private
 */
export const getProgressLogById = asyncHandler(async (req, res) => {
  const log = await Progress.findById(req.params.id).populate('submittedBy', 'name email avatar');

  if (!log) {
    res.status(404);
    throw new Error('Progress log not found');
  }

  res.status(200).json({ success: true, log });
});

/**
 * @desc    Submit a daily or weekly progress log; also syncs the parent
 *          project's completionPercentage to the latest reported value.
 * @route   POST /api/v1/progress
 * @access  Private
 */
export const createProgressLog = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const log = await Progress.create({ ...req.body, submittedBy: req.user._id });

  project.completionPercentage = log.completionPercentage;
  await project.save();

  res.status(201).json({
    success: true,
    message: 'Progress log submitted successfully',
    log,
  });
});

/**
 * @desc    Update a progress log (only the submitter or a manager/admin)
 * @route   PUT /api/v1/progress/:id
 * @access  Private
 */
export const updateProgressLog = asyncHandler(async (req, res) => {
  const log = await Progress.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Progress log not found');
  }

  const isOwner = log.submittedBy.toString() === req.user._id.toString();
  if (req.user.role === 'worker' && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to update this log');
  }

  const allowedFields = [
    'workSummary',
    'weatherConditions',
    'laborCount',
    'issuesReported',
    'completionPercentage',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) log[field] = req.body[field];
  });

  const updatedLog = await log.save();

  res.status(200).json({
    success: true,
    message: 'Progress log updated successfully',
    log: updatedLog,
  });
});

/**
 * @desc    Add a site photo to a progress log (uploaded via middleware)
 * @route   POST /api/v1/progress/:id/photos
 * @access  Private
 */
export const addSitePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No photo uploaded');
  }

  const log = await Progress.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Progress log not found');
  }

  log.sitePhotos.push({
    url: req.file.path,
    publicId: req.file.filename,
    caption: req.body.caption || '',
  });

  await log.save();

  res.status(201).json({
    success: true,
    message: 'Site photo uploaded successfully',
    sitePhotos: log.sitePhotos,
  });
});

/**
 * @desc    Delete a progress log
 * @route   DELETE /api/v1/progress/:id
 * @access  Private (admin, manager)
 */
export const deleteProgressLog = asyncHandler(async (req, res) => {
  const log = await Progress.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Progress log not found');
  }

  await log.deleteOne();

  res.status(200).json({ success: true, message: 'Progress log deleted successfully' });
});

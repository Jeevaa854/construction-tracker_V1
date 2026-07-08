import asyncHandler from 'express-async-handler';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

/**
 * @desc    Get all projects visible to the requesting user.
 *          Admin/Manager see all; workers only see projects they're assigned to.
 * @route   GET /api/v1/projects?search=&status=&page=&limit=
 * @access  Private
 */
export const getProjects = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = { isArchived: false };

  if (req.user.role === 'worker') {
    filter.workers = req.user._id;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('manager', 'name email avatar')
      .populate('workers', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    projects,
  });
});

/**
 * @desc    Get a single project by id, including a live task-completion summary
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('manager', 'name email avatar')
    .populate('workers', 'name email avatar')
    .populate('createdBy', 'name email');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (
    req.user.role === 'worker' &&
    !project.workers.some((w) => w._id.toString() === req.user._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to view this project');
  }

  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    project,
    taskStats: taskStats[0] || { totalTasks: 0, completedTasks: 0 },
  });
});

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private (admin, manager)
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project,
  });
});

/**
 * @desc    Update a project (details, status, manager, workers, milestones)
 * @route   PUT /api/v1/projects/:id
 * @access  Private (admin, manager assigned to the project)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const isAssignedManager = project.manager.toString() === req.user._id.toString();
  if (req.user.role === 'manager' && !isAssignedManager) {
    res.status(403);
    throw new Error('Only the assigned manager can update this project');
  }

  const allowedFields = [
    'name',
    'description',
    'location',
    'client',
    'manager',
    'workers',
    'status',
    'priority',
    'startDate',
    'endDate',
    'actualEndDate',
    'completionPercentage',
    'estimatedBudget',
    'milestones',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  });

  const updatedProject = await project.save();

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    project: updatedProject,
  });
});

/**
 * @desc    Archive (soft-delete) a project
 * @route   DELETE /api/v1/projects/:id
 * @access  Private (admin)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  project.isArchived = true;
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Project archived successfully',
  });
});

/**
 * @desc    Assign or replace the list of workers on a project
 * @route   PUT /api/v1/projects/:id/workers
 * @access  Private (admin, manager)
 */
export const assignWorkers = asyncHandler(async (req, res) => {
  const { workers } = req.body;

  if (!Array.isArray(workers)) {
    res.status(400);
    throw new Error('workers must be an array of user ids');
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  project.workers = workers;
  await project.save();

  res.status(200).json({
    success: true,
    message: 'Workers assigned successfully',
    project,
  });
});

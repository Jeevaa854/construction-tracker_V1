import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import notify from '../utils/notify.js';
import logActivity from '../utils/logActivity.js';

/**
 * @desc    Get tasks (optionally filtered by project, status, priority, assignee)
 * @route   GET /api/v1/tasks?project=&status=&priority=&page=&limit=
 * @access  Private
 */
export const getTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  // Workers only ever see tasks assigned to them
  if (req.user.role === 'worker') {
    filter.assignedTo = req.user._id;
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name status')
      .populate('createdBy', 'name email')
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    tasks,
  });
});

/**
 * @desc    Get a single task by id
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('project', 'name status manager')
    .populate('createdBy', 'name email')
    .populate('comments.author', 'name avatar');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.status(200).json({ success: true, task });
});

/**
 * @desc    Create a task under a project
 * @route   POST /api/v1/tasks
 * @access  Private (admin, manager)
 */
export const createTask = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const task = await Task.create({ ...req.body, createdBy: req.user._id });

  // Notify each assigned worker
  if (Array.isArray(task.assignedTo)) {
    await Promise.all(
      task.assignedTo.map((workerId) =>
        notify({
          recipientId: workerId,
          type: 'task-assigned',
          title: 'New Task Assigned',
          message: `You've been assigned to "${task.title}" on project "${project.name}".`,
          relatedProject: project._id,
          relatedTask: task._id,
        })
      )
    );
  }

  await logActivity({
    userId: req.user._id,
    action: `Created task "${task.title}"`,
    entityType: 'Task',
    entityId: task._id,
  });

  res.status(201).json({ success: true, message: 'Task created successfully', task });
});

/**
 * @desc    Update a task (details, status, priority, progress, assignment)
 * @route   PUT /api/v1/tasks/:id
 * @access  Private (admin, manager, or assigned worker for status/progress only)
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isAssignedWorker = task.assignedTo.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (req.user.role === 'worker') {
    if (!isAssignedWorker) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }
    // Workers may only update status/progress/comments, not reassign or reprioritize.
    const workerAllowedFields = ['status', 'progressPercentage'];
    workerAllowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
  } else {
    const allowedFields = [
      'title',
      'description',
      'assignedTo',
      'status',
      'priority',
      'deadline',
      'progressPercentage',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
  }

  const wasCompleted = task.status === 'completed';
  const updatedTask = await task.save();

  if (!wasCompleted && updatedTask.status === 'completed') {
    const project = await Project.findById(updatedTask.project);
    if (project) {
      await notify({
        recipientId: project.manager,
        type: 'task-completed',
        title: 'Task Completed',
        message: `"${updatedTask.title}" has been marked completed.`,
        relatedProject: project._id,
        relatedTask: updatedTask._id,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    task: updatedTask,
  });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private (admin, manager)
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

/**
 * @desc    Add a comment to a task
 * @route   POST /api/v1/tasks/:id/comments
 * @access  Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required');
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.comments.push({ text: text.trim(), author: req.user._id });
  await task.save();

  const populatedTask = await Task.findById(task._id).populate('comments.author', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    comments: populatedTask.comments,
  });
});

/**
 * @desc    Upload an attachment to a task (file already stored in Cloudinary
 *          by the upload middleware; this persists its metadata to the task)
 * @route   POST /api/v1/tasks/:id/attachments
 * @access  Private
 */
export const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.attachments.push({
    url: req.file.path,
    publicId: req.file.filename,
    fileName: req.file.originalname,
    uploadedBy: req.user._id,
  });

  await task.save();

  res.status(201).json({
    success: true,
    message: 'Attachment uploaded successfully',
    attachments: task.attachments,
  });
});

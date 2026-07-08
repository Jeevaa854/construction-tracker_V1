import asyncHandler from 'express-async-handler';
import Resource from '../models/Resource.js';
import notify from '../utils/notify.js';

/**
 * @desc    Get resources, optionally filtered by project/type/status
 * @route   GET /api/v1/resources?project=&type=&status=&page=&limit=
 * @access  Private
 */
export const getResources = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate('project', 'name')
      .populate('allocatedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Resource.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: resources.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    resources,
  });
});

/**
 * @desc    Get a single resource
 * @route   GET /api/v1/resources/:id
 * @access  Private
 */
export const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id)
    .populate('project', 'name')
    .populate('allocatedTo', 'name email');

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json({ success: true, resource });
});

/**
 * @desc    Create a resource entry
 * @route   POST /api/v1/resources
 * @access  Private (admin, manager)
 */
export const createResource = asyncHandler(async (req, res) => {
  const resource = await Resource.create({ ...req.body, createdBy: req.user._id });

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    resource,
  });
});

/**
 * @desc    Update a resource (details, status, allocation)
 * @route   PUT /api/v1/resources/:id
 * @access  Private (admin, manager)
 */
export const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const allowedFields = [
    'name',
    'type',
    'vendor',
    'quantity',
    'unit',
    'unitCost',
    'status',
    'allocatedTo',
    'purchaseDate',
    'notes',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) resource[field] = req.body[field];
  });

  const updatedResource = await resource.save();

  if (updatedResource.allocatedTo && req.body.allocatedTo) {
    await notify({
      recipientId: updatedResource.allocatedTo,
      type: 'resource-alert',
      title: 'Resource Allocated to You',
      message: `"${updatedResource.name}" has been allocated to you.`,
      relatedProject: updatedResource.project,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully',
    resource: updatedResource,
  });
});

/**
 * @desc    Delete a resource
 * @route   DELETE /api/v1/resources/:id
 * @access  Private (admin, manager)
 */
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  await resource.deleteOne();

  res.status(200).json({ success: true, message: 'Resource deleted successfully' });
});

/**
 * @desc    Add a maintenance record to a resource
 * @route   POST /api/v1/resources/:id/maintenance
 * @access  Private (admin, manager)
 */
export const addMaintenanceRecord = asyncHandler(async (req, res) => {
  const { date, description, cost, performedBy } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  resource.maintenanceRecords.push({ date, description, cost, performedBy });
  resource.status = 'under-maintenance';
  await resource.save();

  res.status(201).json({
    success: true,
    message: 'Maintenance record added',
    resource,
  });
});

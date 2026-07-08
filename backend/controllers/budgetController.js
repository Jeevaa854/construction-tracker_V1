import asyncHandler from 'express-async-handler';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import Project from '../models/Project.js';
import notify from '../utils/notify.js';

/**
 * @desc    Get the budget for a project (with computed actual spend & remaining)
 * @route   GET /api/v1/budgets/project/:projectId
 * @access  Private
 */
export const getBudgetByProject = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ project: req.params.projectId }).populate(
    'approvedBy',
    'name email'
  );

  if (!budget) {
    res.status(404);
    throw new Error('No budget has been set up for this project yet');
  }

  const expenseAgg = await Expense.aggregate([
    { $match: { project: budget.project, approvalStatus: 'approved' } },
    { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
  ]);

  const totalSpent = expenseAgg[0]?.totalSpent || 0;
  const remaining = budget.totalEstimated - totalSpent;

  res.status(200).json({
    success: true,
    budget,
    totalSpent,
    remaining,
    percentageUsed: budget.totalEstimated
      ? Math.round((totalSpent / budget.totalEstimated) * 100)
      : 0,
  });
});

/**
 * @desc    Create the budget plan for a project
 * @route   POST /api/v1/budgets
 * @access  Private (admin, manager)
 */
export const createBudget = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const existing = await Budget.findOne({ project: req.body.project });
  if (existing) {
    res.status(400);
    throw new Error('A budget already exists for this project. Use update instead.');
  }

  const budget = await Budget.create({ ...req.body, createdBy: req.user._id });

  res.status(201).json({ success: true, message: 'Budget created successfully', budget });
});

/**
 * @desc    Update a project's budget plan
 * @route   PUT /api/v1/budgets/:id
 * @access  Private (admin, manager)
 */
export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }

  const allowedFields = ['totalEstimated', 'categories', 'contingencyPercentage', 'currency'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) budget[field] = req.body[field];
  });

  if (req.user.role === 'admin' && req.body.approve === true) {
    budget.approvedBy = req.user._id;
    budget.approvedAt = new Date();
  }

  const updatedBudget = await budget.save();

  res.status(200).json({
    success: true,
    message: 'Budget updated successfully',
    budget: updatedBudget,
  });
});

/**
 * @desc    List expenses for a project (with pagination + filters)
 * @route   GET /api/v1/budgets/expenses?project=&category=&status=&page=&limit=
 * @access  Private
 */
export const getExpenses = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.approvalStatus = req.query.status;

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('recordedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: expenses.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    expenses,
  });
});

/**
 * @desc    Record a new expense against a project
 * @route   POST /api/v1/budgets/expenses
 * @access  Private (admin, manager)
 */
export const createExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...req.body, recordedBy: req.user._id });

  // Check whether this pushes the project over budget and alert the manager if so.
  const budget = await Budget.findOne({ project: expense.project });
  if (budget) {
    const expenseAgg = await Expense.aggregate([
      { $match: { project: expense.project, approvalStatus: 'approved' } },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
    ]);
    const totalSpent = expenseAgg[0]?.totalSpent || 0;

    if (totalSpent >= budget.totalEstimated * 0.9) {
      const project = await Project.findById(expense.project);
      if (project) {
        await notify({
          recipientId: project.manager,
          type: 'budget-alert',
          title: 'Budget Threshold Alert',
          message: `Project "${project.name}" has used ${Math.round(
            (totalSpent / budget.totalEstimated) * 100
          )}% of its estimated budget.`,
          relatedProject: project._id,
        });
      }
    }
  }

  res.status(201).json({ success: true, message: 'Expense recorded successfully', expense });
});

/**
 * @desc    Approve or reject an expense
 * @route   PUT /api/v1/budgets/expenses/:id/status
 * @access  Private (admin, manager)
 */
export const updateExpenseStatus = asyncHandler(async (req, res) => {
  const { approvalStatus } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
    res.status(400);
    throw new Error('Invalid approval status');
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  expense.approvalStatus = approvalStatus;
  expense.approvedBy = req.user._id;
  await expense.save();

  res.status(200).json({
    success: true,
    message: `Expense ${approvalStatus} successfully`,
    expense,
  });
});

/**
 * @desc    Delete an expense entry
 * @route   DELETE /api/v1/budgets/expenses/:id
 * @access  Private (admin, manager)
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  await expense.deleteOne();

  res.status(200).json({ success: true, message: 'Expense deleted successfully' });
});

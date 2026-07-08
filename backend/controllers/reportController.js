import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';

/**
 * Streams a PDFKit document straight to the HTTP response as a downloadable file.
 */
const streamPdf = (res, filename, buildContent) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  buildContent(doc);
  doc.end();
};

/**
 * @desc    Export a single project's full report (details, tasks, budget) as PDF
 * @route   GET /api/v1/reports/project/:id/pdf
 * @access  Private
 */
export const exportProjectReportPdf = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('manager', 'name email')
    .populate('workers', 'name email');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const tasks = await Task.find({ project: project._id }).populate('assignedTo', 'name');
  const budget = await Budget.findOne({ project: project._id });
  const expenses = await Expense.find({ project: project._id, approvalStatus: 'approved' });
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  streamPdf(res, `project-report-${project._id}.pdf`, (doc) => {
    doc.fontSize(20).text('Construction Project Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(project.name, { underline: true });
    doc.fontSize(10).text(`Status: ${project.status}  |  Priority: ${project.priority}`);
    doc.text(`Manager: ${project.manager?.name || 'N/A'}`);
    doc.text(`Workers: ${project.workers.map((w) => w.name).join(', ') || 'None assigned'}`);
    doc.text(
      `Start: ${new Date(project.startDate).toDateString()}  |  Expected End: ${new Date(
        project.endDate
      ).toDateString()}`
    );
    doc.text(`Completion: ${project.completionPercentage}%`);
    doc.moveDown();

    doc.fontSize(12).text('Budget Summary', { underline: true });
    if (budget) {
      doc
        .fontSize(10)
        .text(`Estimated Budget: $${budget.totalEstimated.toLocaleString()}`)
        .text(`Actual Spent (approved): $${totalSpent.toLocaleString()}`)
        .text(`Remaining: $${(budget.totalEstimated - totalSpent).toLocaleString()}`);
    } else {
      doc.fontSize(10).text('No budget has been set up for this project.');
    }
    doc.moveDown();

    doc.fontSize(12).text('Tasks', { underline: true });
    if (tasks.length === 0) {
      doc.fontSize(10).text('No tasks recorded.');
    } else {
      tasks.forEach((task) => {
        doc
          .fontSize(10)
          .text(
            `- ${task.title} | Status: ${task.status} | Progress: ${task.progressPercentage}% | Assigned: ${
              task.assignedTo.map((a) => a.name).join(', ') || 'Unassigned'
            }`
          );
      });
    }

    doc.moveDown();
    doc.fontSize(8).fillColor('gray').text(`Generated on ${new Date().toLocaleString()}`, {
      align: 'right',
    });
  });
});

/**
 * @desc    Export a project's budget/expense breakdown as an Excel workbook
 * @route   GET /api/v1/reports/project/:id/budget/excel
 * @access  Private
 */
export const exportBudgetReportExcel = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const expenses = await Expense.find({ project: project._id })
    .populate('recordedBy', 'name')
    .sort({ date: -1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Construction Tracker';
  const sheet = workbook.addWorksheet('Budget Report');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Amount ($)', key: 'amount', width: 15 },
    { header: 'Status', key: 'approvalStatus', width: 12 },
    { header: 'Recorded By', key: 'recordedBy', width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  expenses.forEach((e) => {
    sheet.addRow({
      date: new Date(e.date).toLocaleDateString(),
      category: e.category,
      description: e.description,
      amount: e.amount,
      approvalStatus: e.approvalStatus,
      recordedBy: e.recordedBy?.name || 'N/A',
    });
  });

  sheet.addRow({});
  const totalRow = sheet.addRow({
    description: 'TOTAL',
    amount: expenses.reduce((sum, e) => sum + e.amount, 0),
  });
  totalRow.font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="budget-report-${project._id}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @desc    Export worker performance report (tasks completed, in progress) as Excel
 * @route   GET /api/v1/reports/workers/excel
 * @access  Private (admin, manager)
 */
export const exportWorkerReportExcel = asyncHandler(async (req, res) => {
  const workers = await User.find({ role: 'worker' });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Worker Report');

  sheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Total Tasks', key: 'totalTasks', width: 15 },
    { header: 'Completed', key: 'completed', width: 15 },
    { header: 'In Progress', key: 'inProgress', width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const worker of workers) {
    const [totalTasks, completed, inProgress] = await Promise.all([
      Task.countDocuments({ assignedTo: worker._id }),
      Task.countDocuments({ assignedTo: worker._id, status: 'completed' }),
      Task.countDocuments({ assignedTo: worker._id, status: 'in-progress' }),
    ]);

    sheet.addRow({
      name: worker.name,
      email: worker.email,
      totalTasks,
      completed,
      inProgress,
    });
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="worker-report.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  exportProjectReportPdf,
  exportBudgetReportExcel,
  exportWorkerReportExcel,
} from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);

router.get('/project/:id/pdf', exportProjectReportPdf);
router.get('/project/:id/budget/excel', exportBudgetReportExcel);
router.get('/workers/excel', authorize('admin', 'manager'), exportWorkerReportExcel);

export default router;

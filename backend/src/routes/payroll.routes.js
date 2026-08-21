const express = require('express');
const {
  createPeriod, listPeriods, runPayroll, listPayrollRuns, downloadPayslip,
} = require('../controllers/payrollController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/periods', listPeriods);
router.post('/periods', requireRole('admin'), createPeriod);
router.post('/periods/:periodId/run', requireRole('admin'), runPayroll);
router.get('/periods/:periodId/runs', listPayrollRuns);
router.get('/runs/:runId/payslip', downloadPayslip);

module.exports = router;

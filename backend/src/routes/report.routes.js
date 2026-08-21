const express = require('express');
const { dashboardSummary, payrollReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', dashboardSummary);
router.get('/payroll', payrollReport);

module.exports = router;

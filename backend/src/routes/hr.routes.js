const express = require('express');

const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  listPositions,
  createPosition,
  updatePosition,
  deletePosition,

  getEmployeeHR,

  listContracts,
  createContract,
  updateContract,

  listEmploymentHistory,
  createEmploymentHistory,
} = require('../controllers/hrController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// =========================================================
// DEPARTMENTS
// =========================================================

router.get('/departments', listDepartments);
router.post('/departments', requireRole('admin'), createDepartment);
router.put('/departments/:id', requireRole('admin'), updateDepartment);
router.delete('/departments/:id', requireRole('admin'), deleteDepartment);

// =========================================================
// POSITIONS
// =========================================================

router.get('/positions', listPositions);
router.post('/positions', requireRole('admin'), createPosition);
router.put('/positions/:id', requireRole('admin'), updatePosition);
router.delete('/positions/:id', requireRole('admin'), deletePosition);

// =========================================================
// EMPLOYEE HR DETAIL
// =========================================================

router.get('/employees/:id', getEmployeeHR);

// =========================================================
// CONTRACTS
// =========================================================

router.get('/employees/:id/contracts', listContracts);
router.post('/employees/:id/contracts', createContract);
router.put(
  '/employees/:id/contracts/:contractId',
  updateContract
);

// =========================================================
// EMPLOYMENT HISTORY
// =========================================================

router.get(
  '/employees/:id/history',
  listEmploymentHistory
);

router.post(
  '/employees/:id/history',
  createEmploymentHistory
);

module.exports = router;
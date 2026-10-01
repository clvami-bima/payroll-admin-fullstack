const express = require('express');

const {
  listLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveBalance,
  getLeaveHistory
} = require('../controllers/leaveController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Daftar pengajuan cuti
router.get('/', listLeaveRequests);

// Detail pengajuan cuti
router.get('/:id', getLeaveRequest);

// Buat pengajuan cuti
router.post(
  '/',
  requireRole('admin', 'hr', 'employee'),
  createLeaveRequest
);

// Approval
router.put(
  '/:id/approve',
  requireRole('admin', 'hr'),
  approveLeaveRequest
);

// Reject
router.put(
  '/:id/reject',
  requireRole('admin', 'hr'),
  rejectLeaveRequest
);

// Cancel
router.put(
  '/:id/cancel',
  requireRole('admin', 'hr', 'employee'),
  cancelLeaveRequest
);

// Sisa cuti
router.get(
  '/:employeeId/balance',
  getLeaveBalance
);

// Riwayat cuti
router.get(
  '/:employeeId/history',
  getLeaveHistory
);

module.exports = router;

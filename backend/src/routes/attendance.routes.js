const express = require('express');

const {
  listAttendance,
  getAttendance,
  checkIn,
  checkOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  attendanceSummary
} = require('../controllers/attendanceController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listAttendance);

router.get('/summary', attendanceSummary);

router.get('/:id', getAttendance);

router.post('/check-in', checkIn);

router.put('/:id/check-out', checkOut);

router.post('/', createAttendance);

router.put('/:id', updateAttendance);

router.delete(
  '/:id',
  requireRole('admin'),
  deleteAttendance
);

module.exports = router;